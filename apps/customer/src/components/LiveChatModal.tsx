import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { ArrowLeft, Phone, Send, Mic, Image, Sparkles, CheckCheck } from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
  courierName: string;
  courierPhone: string;
}

export const LiveChatModal: React.FC<Props> = ({
  messages,
  onSendMessage,
  onClose,
  courierName,
  courierPhone,
}) => {
  const [inputText, setInputText] = useState('');

  const quickReplies = [
    '🔔 Sonnez 2 fois à l\'interphone B14',
    '💵 J\'ai la monnaie exacte (1 200 DZD)',
    '🏢 Je descends devant l\'immeuble',
    '🚪 Déposez devant la porte',
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickSend = (text: string) => {
    onSendMessage(text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div className="w-full max-w-[430px] h-full sm:h-[680px] bg-[#F6F7F9] flex flex-col sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Chat Header */}
        <header className="bg-white px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Retour"
              className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-zinc-700 active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-[14px] text-[#1C1B1B]">{courierName}</h2>
                <span className="w-2 h-2 rounded-full bg-[#00B578]"></span>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Livreur RYM • En route à moto</span>
            </div>
          </div>

          <a
            href={`tel:${courierPhone}`}
            aria-label="Appeler le livreur"
            className="w-8 h-8 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center active:scale-95"
          >
            <Phone size={15} />
          </a>
        </header>

        {/* Canned Quick Actions Strip */}
        <div className="bg-white border-b border-neutral-100 px-3 py-1.5 overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickSend(qr)}
              className="text-[11px] bg-neutral-100 hover:bg-neutral-200 text-zinc-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap active:scale-95 transition-all"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-3.5 space-y-3 overflow-y-auto no-scrollbar">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-[10px] bg-neutral-200/80 text-zinc-600 px-3 py-1 rounded-full text-center max-w-[85%] font-medium">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMe = msg.sender === 'customer';

            return (
              <div key={msg.id} className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : ''}`}>
                {msg.senderAvatar && (
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-black/10"
                  />
                )}

                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-[#D9943B] text-[#1C1B1B] rounded-br-xs font-medium'
                        : 'bg-white text-zinc-800 rounded-bl-xs border border-neutral-100'
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-[9px] text-zinc-400">{msg.timestamp}</span>
                    {isMe && <CheckCheck size={12} className="text-zinc-500" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Input Bar */}
        <footer className="p-2.5 bg-white border-t border-neutral-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-zinc-500 hover:text-zinc-800"
              aria-label="Enregistrer un vocal"
            >
              <Mic size={17} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrire un message à Karim..."
              className="flex-1 bg-neutral-100 rounded-full px-3.5 py-2 text-xs text-[#1C1B1B] placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#D9943B]"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-[#D9943B] disabled:bg-neutral-200 disabled:text-zinc-400 text-[#1C1B1B] flex items-center justify-center shadow-xs active:scale-95 transition-all"
              aria-label="Envoyer"
            >
              <Send size={15} />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};
