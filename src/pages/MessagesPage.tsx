import { useEffect, useState } from "react";
import { Avatar } from "../components/ui/Avatar";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { messageService } from "../services/messageService";
import type { ConversationPreview } from "../services/messageService";

export function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    messageService.listConversations()
      .then((items) => {
        if (active) setConversations(items);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page-section"><div className="container narrow-container">
      <p className="eyebrow">Good work starts with a conversation</p><h1 className="page-title">Messages</h1><p className="page-lede">Talk through the details with your service provider.</p>
      <div className="conversation-list">
        {loading ? <div className="loading-state"><LoadingSpinner label="Loading conversations" /></div>
          : error ? <ErrorState description={error} />
          : conversations.length ? conversations.map((conversation) => (
            <article className="conversation-row" key={conversation.id}>
              <Avatar initials={conversation.initials} />
              <div><h2>{conversation.name}</h2><p>{conversation.message}</p></div>
              <time>{conversation.time}</time>
            </article>
          ))
          : <EmptyState title="No conversations yet" description="When you contact a provider, your conversations will show up here." />}
      </div>
      <p className="form-hint">Messaging is a frontend preview; messages are not sent or saved.</p>
    </div></section>
  );
}
