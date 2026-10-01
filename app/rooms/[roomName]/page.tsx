import * as React from 'react';
import { PageClientImpl } from './PageClientImpl';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ prompt?: string }>;
}) {
  const { roomName } = await params;
  const { prompt } = await searchParams;
  return <PageClientImpl roomName={roomName} initialPrompt={prompt?.slice(0, 500)} />;
}
