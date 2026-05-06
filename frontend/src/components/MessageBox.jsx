import { useState } from 'react';

function MessageBox() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    setMessages((current) => [
      { id: Date.now(), text: message.trim() },
      ...current,
    ]);
    setMessage('');
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Messages</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A lightweight scratchpad for quick notes during review sessions.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:text-slate-400">
          Session only
        </span>
      </div>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <input
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a quick message"
          value={message}
        />
        <button
          className="rounded-full bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-300"
          type="submit"
        >
          Send
        </button>
      </form>
      <div className="mt-4 space-y-3">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            No messages in this session.
          </div>
        ) : (
          messages.map((item) => (
            <div
              className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              key={item.id}
            >
              {item.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MessageBox;
