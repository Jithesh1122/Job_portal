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
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-xl font-semibold">Messages</h2>
      <form className="mt-4 flex gap-3" onSubmit={handleSubmit}>
        <input
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a quick message"
          value={message}
        />
        <button
          className="rounded-md bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
          type="submit"
        >
          Send
        </button>
      </form>
      <div className="mt-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages in this session.</p>
        ) : (
          messages.map((item) => (
            <div className="rounded-md bg-slate-900 p-3 text-sm text-slate-300" key={item.id}>
              {item.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MessageBox;
