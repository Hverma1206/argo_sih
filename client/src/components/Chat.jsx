import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;
    
    const newMessage = { type: 'user', content: input };
    setMessages([...messages, newMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:3000/ask', {
        query: input
      });
      
      // Convert the answer data to a displayable format
      const formattedAnswer = renderDataResponse(response.data.answer);
      
      setMessages(prev => [...prev, { type: 'bot', content: formattedAnswer }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Function to render data response as a formatted display
  const renderDataResponse = (data) => {
    if (!data || data.length === 0) {
      return "No results found for your query.";
    }

    // If it's an array of objects, render as a table
    return (
      <div className="result-container">
        <h3>Query Results:</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  {Object.values(item).map((value, i) => (
                    <td key={i}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Ocean Data Assistant</h2>
      </div>
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Ask any question about the Argo dataset</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-content">
                {typeof message.content === 'string' ? message.content : message.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="message bot-message">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          rows="1"
        />
        <button 
          onClick={handleSend}
          disabled={loading || input.trim() === ''}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
