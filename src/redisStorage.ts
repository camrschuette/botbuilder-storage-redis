/* eslint-disable @typescript-eslint/explicit-member-accessibility */

/** *********************************************************************************
 *
 * botbuilder-storage-redis
 *
 ********************************************************************************** */

import { RedisClient } from 'redis';
import { Storage, StoreItems } from 'botbuilder';
import { promisify } from 'util';

export class RedisDbStorage implements Storage {
  private redis: RedisClient;
  private ttlInSeconds: number;
  private getAsyncFromRedis: (key: string) => Promise<string>;
  private setAsyncFromRedis: (key: string, value: string) => Promise<void>;
  private delAsyncFromRedis: (arg1: string) => Promise<void>;

  constructor(client: RedisClient) {
    this.redis = client;
    this.getAsyncFromRedis = promisify(client.get).bind(client);
    this.setAsyncFromRedis = promisify(client.set).bind(client);
    this.delAsyncFromRedis = promisify(client.del).bind(client);
  }

  public async read(stateKeys: string[]): Promise<StoreItems> {
    const data: StoreItems = {};

    if (!stateKeys || stateKeys.length === 0) {
      return data;
    }

    const allKeysValuesFromRedis = Promise.all(
      stateKeys.map((key: string): Promise<string> => this.getAsyncFromRedis(key))
    );

    stateKeys.forEach((key: string, index: number): void => {
      data[key] = JSON.parse(allKeysValuesFromRedis[index] || '{}');
    });

    return Promise.resolve(data);
  }

  public async write(changes: StoreItems): Promise<void> {
    if (!changes || Object.keys(changes).length === 0) {
      return;
    }

    const allKeysValuesFromRedis = await Promise.all(Object.keys(changes));
    allKeysValuesFromRedis.forEach((key: string): void => {
      const state = changes[key];
      this.setAsyncFromRedis(key, JSON.stringify(state));
    });

    return Promise.resolve();
  }

  public async delete(keys: string[]): Promise<void> {
    if (!keys || keys.length == 0) {
      return;
    }

    for await (const key of keys) {
      this.delAsyncFromRedis(key);
    }
    return Promise.resolve();
  }
}
