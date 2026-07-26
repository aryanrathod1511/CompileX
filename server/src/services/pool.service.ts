import { Container } from 'dockerode';
import { docker } from '../infrastructure/docker.client';
import { LANGUAGES } from '../config/languages.config';
import { SandboxService } from './sandbox.service';

export class ContainerPoolManager {
  private static pools: Map<string, Container[]> = new Map();

  public static async initializePools(): Promise<void> {
    for (const [language, config] of Object.entries(LANGUAGES)) {
      this.pools.set(language, []);
      await this.refillContainer(language, config);
    }
  }


  private static async refillContainer(language: string, config: any): Promise<void> {
    const con = await SandboxService.createContainer(config);
    this.pools.get(language)?.push(con);
  }


  public static async acquireContainer(language: string): Promise<Container> {
    try {
      const pool = this.pools.get(language);
      let con: Container;
      if (pool && pool.length > 0) {
        con = pool[0];
        pool.shift();
      } else {
        // spawn up a new one
        con = await SandboxService.createContainer(LANGUAGES[language]);
      }

      // refill the pool in the background
      this.refillContainer(language, LANGUAGES[language]).catch((err) => {
        console.error(`[PoolManager] Failed to refill pool for ${language}:`, err);
      });
      return con;
    } catch (err: any) {
      throw new Error(`Failed to acquire container for language ${language}: ${err.message}`);
    }
  }


  public static async shutdownPools(): Promise<void> {
    for (const [language, pool] of this.pools.entries()) {
      const stopPromises = pool.map(async (container) => {
        try {
          await container.stop({ t: 0 });
        } catch (e) {
          // Container might already be stopped
        }
      });
      await Promise.all(stopPromises);
      this.pools.set(language, []);
    }          // Container might already be stopped

  }
}
