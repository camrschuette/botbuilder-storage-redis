/* eslint-disable @typescript-eslint/explicit-member-accessibility */

/** *********************************************************************************
 *
 * botbuilder-storage-redis
 * Copyright 2019 Generali
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

    await Promise.all(
      stateKeys.map(
        async (key: string): Promise<void> => {
          const result = await this.getAsyncFromRedis(key);
          data[key] = JSON.parse(result || '{}');
          Promise.resolve();
        }
      )
    );

    return Promise.resolve(data);
  }

  public async write(changes: StoreItems): Promise<void> {
    if (!changes || Object.keys(changes).length === 0) {
      return;
    }

    await Promise.all(
      Object.keys(changes).map(
        async (key): Promise<void> => {
          const state = changes[key];

          await this.setAsyncFromRedis(key, JSON.stringify(state));

          Promise.resolve();
        }
      )
    );
  }

  public async delete(keys: string[]): Promise<void> {
    if (!keys || keys.length == 0) {
      return;
    }

    await Promise.all(
      keys.map(
        async (key: string): Promise<void> => {
          await this.delAsyncFromRedis(key);

          Promise.resolve();
        }
      )
    );
  }
}