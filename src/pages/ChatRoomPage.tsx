"use client";

import React from 'react';
import { useParams } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';

const ChatRoomPage = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Chat Room</h1>
      <p className="text-muted-foreground">Chat room for ID: {chatRoomId}. Content coming soon!</p>
      <MadeWithDyad />
    </div>
  );
};

export default ChatRoomPage;