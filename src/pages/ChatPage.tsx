"use client";

import React from 'react';
import { useParams } from 'react-router-dom';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Chat</h1>
      {chatId ? (
        <p className="text-muted-foreground">This is a placeholder for the chat with ID: {chatId}.</p>
      ) : (
        <p className="text-muted-foreground">This is a placeholder for the main Chat page.</p>
      )}
    </div>
  );
};

export default ChatPage;