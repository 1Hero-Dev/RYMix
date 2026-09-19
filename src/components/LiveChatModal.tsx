import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { LazyImage } from './common/LazyImage';
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
    <div className="fixed inset-0 z-50 bg-[#071E26]/70 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div className="w-full max-w-[430px] h-full sm:h-[680px] bg-[#F8F4EC] flex flex-col sm:rounded-3xl shadow-2xl overflow-hidden border border-[#EADBCE] animate-in fade-in slide-in-from-bottom duration-200">
        {/* Chat Header */}
        <header className="bg-white px-3.5 py-2.5 flex items-center justify-between border-b border-[#EADBCE] shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Retour"
              className="w-8 h-8 rounded-full bg-[#F8F4EC] flex items-center justify-center text-[#0A2B35] active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-[14px] text-[#0A2B35]">{courierName}</h2>
                <span className="w-2 h-2 rounded-full bg-[#D9943B]"></span>
              </div>
              <span className="text-[10px] text-[#648692] font-medium">Livreur • En route à moto</span>
            </div>
          </div>

          <a
            href={`tel:${courierPhone}`}
            aria-label="Appeler le livreur"
            className="w-8 h-8 rounded-full bg-[#F7EBD9] text-[#0A2B35] border border-[#EADBCE] flex items-center justify-center active:scale-95"
          >
            <Phone size={15} />
          </a>
        </header>

        {/* Canned Quick Actions Strip */}
        <div className="bg-white border-b border-[#EADBCE]/50 px-3 py-1.5 overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickSend(qr)}
              className="text-[11px] bg-[#F8F4EC] hover:bg-[#EADBCE] text-[#0A2B35] px-2.5 py-1 rounded-full font-medium whitespace-nowrap active:scale-95 transition-all cursor-pointer"
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
                  <span className="text-[10px] bg-[#EADBCE]/60 text-[#0A2B35] px-3 py-1 rounded-full text-center max-w-[85%] font-medium">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMe = msg.sender === 'customer';

            return (
              <div key={msg.id} className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : ''}`}>
                {msg.senderAvatar && (
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#EADBCE]">
                    <LazyImage
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      placeholderType="avatar"
                      targetWidth={60}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-[#D9943B] text-[#071E26] rounded-br-xs font-semibold'
                        : 'bg-white text-[#0A2B35] rounded-bl-xs border border-[#EADBCE]'
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-[9px] text-[#648692]">{msg.timestamp}</span>
                    {isMe && <CheckCheck size={12} className="text-[#071E26]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Input Bar */}
        <footer className="p-2.5 bg-white border-t border-[#EADBCE] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#F8F4EC] flex items-center justify-center text-[#648692] hover:text-[#0A2B35] cursor-pointer"
              aria-label="Enregistrer un vocal"
            >
              <Mic size={17} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrire un message à Karim..."
              className="flex-1 bg-[#F8F4EC] rounded-full px-3.5 py-2 text-xs text-[#0A2B35] placeholder:text-[#648692] focus:outline-none focus:ring-1 focus:ring-[#D9943B]"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-[#0A2B35] disabled:bg-[#EADBCE] disabled:text-[#648692] text-[#D9943B] flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
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
