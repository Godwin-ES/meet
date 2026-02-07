'use client';

import { useRouter } from 'next/navigation';
import { generateRoomId } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

export default function Page() {
  const router = useRouter();

  const startChat = () => {
    const roomName = generateRoomId();
    router.push(`/rooms/${roomName}`);
  };

  return (
    <main className={styles.main} data-lk-theme="default">
      <div style={{ textAlign: 'center' }}>
        <h1>My AI Agent</h1>
        <p>Click below to start a voice conversation.</p>
        <button 
          className="lk-button" 
          onClick={startChat}
          style={{ marginTop: '20px', padding: '10px 30px' }}
        >
          Start Chatting
        </button>
      </div>
    </main>
  );
}