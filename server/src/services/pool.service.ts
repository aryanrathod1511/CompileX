import { Container } from 'dockerode';
import { docker } from '../infrastructure/docker.client';
import { LANGUAGES } from '../config/languages.config';
import { SandboxService } from './sandbox.service';

export class ContainerPoolManager {
  private static pools: Map<string, Container[]> = new Map();

  /**
   * Initializes the container pools for all supported languages.
   * This should be called once on worker startup.
   */
  public static async initializePools(): Promise<void> {
    for (const [language, config] of Object.entries(LANGUAGES)) {
      this.pools.set(language, []);
      await this.refillContainer(language, config);
    }
  }

  /**
   * Spawns a single container for the given language config, starts it,
   * and pushes it to the respective language pool.
   * @param language The name of the programming language.
   */
  private static async refillContainer(language: string, config: any): Promise<void> {
    const con = await SandboxService.createContainer(config);
    this.pools.get(language)?.push(con);
  }

  /**
   * Retrieves an idle warm container from the pool for the requested language.
   * If the pool is empty, falls back to creating one dynamically.
   * @param language The programming language required.
   * @returns A Promise resolving to a running Dockerode Container.
   */
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

  /**
   * Gracefully shuts down and cleans up all containers currently stored in the pools.
   */
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
