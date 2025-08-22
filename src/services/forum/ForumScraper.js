// src/services/forum/ForumScraper.js
import axios from 'axios';
import { logger } from '../../utils/logger.js';

const USER_AGENT = 'Mozilla/5.0 (Linux; Linux i664 x86_64) Gecko/20100101 Firefox/70.8';

class NotLoggedInError extends Error {}

function extractXfToken(html) {
  const pattern = /name="_xfToken" value="([^"]+)"/;
  const match = pattern.exec(html);
  if (!match) throw new Error("XfToken not found in HTML");
  return match[1];
}

function extractCookies(header) {
  if (!header['set-cookie']) return '';
  return header['set-cookie'].map(c => c.split(';')[0]).join('; ');
}

function isLoggedIn(html) {
  return /data-logged-in="true"/.test(html);
}

export class ForumScraper {
  constructor({ url, cookie, userAgent = USER_AGENT, timeout = 10000 }) {
    this.url = url;
    this.initialCookie = cookie;
    this.userAgent = userAgent;
    this.cookies = `xf_user=${cookie}`;
    this.payload = {};
    this.timeout = timeout;

    this.http = axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent': this.userAgent,
        'Cookie': this.cookies,
      }
    });
  }

  async getAuthorization() {
    try {
      logger.debug('Getting forum authorization...');

      const res = await this.http.get(`${this.url}/help`);

      if (!isLoggedIn(res.data)) {
        throw new NotLoggedInError("Not logged in! Check your cookie.");
      }

      const newCookies = extractCookies(res.headers);
      if (newCookies) {
        this.cookies = newCookies;
        this.http.defaults.headers['Cookie'] = this.cookies;
      }

      this.payload._xfToken = extractXfToken(res.data);

      logger.info('Forum authorization successful');

    } catch (err) {
      logger.error('Forum authorization failed:', err.message);
      throw new NotLoggedInError(`Login failed: ${err.message}`);
    }
  }

  async createConversation(recipients, title, message) {
    const data = {
      recipients: recipients.join(', '),
      title,
      message,
      _xfToken: this.payload._xfToken,
    };

    try {
      const res = await this.http.post(`${this.url}/conversations/add`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        validateStatus: function (status) {
          return status !== 429;
        }
      });
      return true;
    } catch (error) {
      logger.error('Failed to create conversation:', error.message);
      return false;
    }
  }

  async reply(threadUri, message) {
    const data = {
      message,
      _xfToken: this.payload._xfToken
    };

    try {
      const res = await this.http.post(`${this.url}/threads/${threadUri}/add-reply`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        validateStatus: function (status) {
          return status !== 429;
        }
      });
      return true;
    } catch (error) {
      logger.error('Failed to reply to thread:', error.message);
      return false;
    }
  }

  async replyConversation(uri, message) {
    const data = {
      message,
      _xfToken: this.payload._xfToken,
    };

    try {
      const res = await this.http.post(`${this.url}${uri}add-reply`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        validateStatus: function (status) {
          return status !== 429;
        }
      });

      return true;
    } catch (error) {
      logger.error('Failed to reply to conversation:', error.message);
      return false;
    }
  }

  async unreadConversations() {
    try {
      const url = `${this.url}/conversations/?unread=1&_xfToken=${this.payload._xfToken}`;
      const res = await this.http.get(url);
      const html = res.data;

      this.payload._xfToken = extractXfToken(html) // renew XfToken

      const matches = [...html.matchAll(/data-author="([^"]+)">[\s\S]+?<a href="([^"]+)unread"/gs)];

      return matches.map(m => ({
        author: m[1],
        uri: m[2],
      })).reverse();
      
    } catch (error) {
      logger.error('Failed to get unread conversations:', error.message);
      return [];
    }
  }

  async markRead(uri) {
    try {
      const url = `${this.url}${uri}mark-unread?_xfToken=${this.payload._xfToken}&_xfResponseType=json`;
      const res = await this.http.post(url);
      return res.data;
    } catch (error) {
      logger.error('Failed to mark conversation as read:', error.message);
      return null;
    }
  }

  async latestConversationId(uri) {
    try {
      const url = `${this.url}${uri}latest?_xfToken=${this.payload._xfToken}&_xfResponseType=json`;
      const res = await this.http.get(url);
      return res.data.redirect.split('#convMessage-')[1];
    } catch (error) {
      logger.error('Failed to get latest conversation ID:', error.message);
      return null;
    }
  }

  async conversationData(uri, messageId) {
    try {
      const url = `${this.url}${uri}multi-quote?insert[0][id]=${messageId}-0&insert[0][value]=true&quotes={"${messageId}":[true]}&_xfToken=${this.payload._xfToken}&_xfResponseType=json`;
      const res = await this.http.post(url);
      const quoteText = res.data['0'].quote;

      if (quoteText === "") {
        throw new Error("Message is empty or bad formatted.");
      }

      const matches = [...quoteText.matchAll(/QUOTE="([^,]+),\s*[^,]+,\s*member:\s*([^"]+)"\](.*?)\[\/QUOTE\]/gs)];
      if (!matches.length) {
        throw new Error('Pattern not found in quote text.');
      }

      const [user_name, user_id, rawMsg] = matches[0].slice(1);

      // Sanitizar mensagem
      const msg = rawMsg.substring(0, 70).replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').trim();

      return { user_name, user_id, msg };
    } catch (error) {
      logger.error('Failed to get conversation data:', error.message);
      throw error;
    }
  }

  async latestUnreadConversations() {
    try {
      const unread = await this.unreadConversations();
      const result = [];

      for (const conv of unread) {
        try {
          const messageId = await this.latestConversationId(conv.uri);
          let messageData = {};

          if (messageId) {
            try {
              messageData = await this.conversationData(conv.uri, messageId);
            } catch (err) {
              logger.warn('Failed to get message data for conversation:', err.message);
            }
          }

          result.push({ ...conv, messageId, messageData });

          // Marcar como lida
          await this.markRead(conv.uri);

          // Delay entre processamentos
          await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
          logger.warn(`Failed to process conversation ${conv.uri}:`, error.message);
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to get latest unread conversations:', error.message);
      return [];
    }
  }
}
