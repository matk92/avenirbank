/**
 * Repository Factory - Interface Layer
 * Generic factory patterns for repository dependency injection
 */

import { Provider } from '@nestjs/common';

export interface RepositoryConfig<T> {
  provide: string | symbol;
  useClass: new (...args: any[]) => T;
  inject?: any[];
}

/**
 * Creates a repository provider for dependency injection
 */
export function createRepositoryProvider<T>(config: RepositoryConfig<T>): Provider {
  const provider: Provider = {
    provide: config.provide,
    useClass: config.useClass,
  };
  
  if (config.inject) {
    (provider as any).inject = config.inject;
  }
  
  return provider;
}

/**
 * Creates multiple repository providers at once
 */
export function createRepositoryProviders<T>(configs: RepositoryConfig<T>[]): Provider[] {
  return configs.map(config => createRepositoryProvider(config));
}

/**
 * Factory for creating use case providers with repository dependencies
 */
export function createUseCaseProvider<T>(
  provide: string | symbol,
  useClass: new (...args: any[]) => T,
  repositoryTokens: (string | symbol)[]
): Provider {
  const provider: Provider = {
    provide,
    useClass,
  };
  
  (provider as any).inject = repositoryTokens;
  
  return provider;
}
