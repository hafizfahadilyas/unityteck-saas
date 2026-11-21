import React, { createContext, useContext } from 'react';

/** When true (Page Builder inspector), draft edits push to canvas cache without waiting for Save. */
const CoffeeFormLiveContext = createContext(false);

export const CoffeeFormLiveProvider = CoffeeFormLiveContext.Provider;

export function useCoffeeFormLive(): boolean {
  return useContext(CoffeeFormLiveContext);
}