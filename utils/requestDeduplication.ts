const processingRequests = new Map<string, Promise<any>>();

export async function deduplicateRequest<T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> {
  if (processingRequests.has(key)) {
    return processingRequests.get(key)!;
  }
  const promise = operation();
  processingRequests.set(key, promise);
  try {
    const result = await promise;
    return result;
  } finally {
    processingRequests.delete(key);
  }
}