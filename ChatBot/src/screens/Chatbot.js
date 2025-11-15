import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomHeader from '../../components/CustomHeader';
import { SafeAreaView } from 'react-native-safe-area-context';


const Chatbot = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]); // { id, sender: 'user'|'bot', text, status?, originalPrompt? }
  const [isSending, setIsSending] = useState(false); // for input button
  const nextId = useRef(0);

  // send a prompt to the backend and update the message with given botMessageId
  const sendToBackend = async (botMessageId, promptToSend) => {
    try {
      // enter the ip address of your backend server if testing on a physical device
      const response = await fetch('http:///localhost/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setMessages(prev => prev.map(m => (m.id === botMessageId ? { ...m, text: data.reply || 'No reply', status: 'done' } : m)));
    } catch (error) {
      console.log('Chatbot fetch error:', error);
      setMessages(prev => prev.map(m => (m.id === botMessageId ? { ...m, text: '⚠️ Something went wrong', status: 'error' } : m)));
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;
    const toSend = prompt;
    setPrompt('');
    setIsSending(true);

    const userMessage = { id: nextId.current++, sender: 'user', text: toSend };
    const botPlaceholder = { id: nextId.current++, sender: 'bot', text: '...', status: 'pending', originalPrompt: toSend };

    setMessages(prev => [...prev, userMessage, botPlaceholder]);
    // fire-and-forget but update result when done
    await sendToBackend(botPlaceholder.id, toSend);
    setIsSending(false);
  };

  // inline bot-side retry removed; retry will be triggered from the user message

  const renderItem = ({ item }) => {
    if (item.sender === 'user') {
      // determine if there's a following bot message that failed for this user message
      const userIndex = messages.findIndex(m => m.id === item.id);
      let failedBot = null;
      if (userIndex >= 0) {
        for (let i = userIndex + 1; i < messages.length; i++) {
          const m = messages[i];
          if (m.sender === 'bot' && m.originalPrompt === item.text) {
            if (m.status === 'error') {
              failedBot = m;
            }
            break; // stop at the first bot reply after this user message
          }
        }
      }

      return (
        <View style={styles.userRow}>
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={styles.userText}>{item.text}</Text>
          </View>

          {failedBot ? (
            <Ionicons name="refresh" size={20} color="#64748b"
              style={styles.refreshButton}
              onPress={async () => {
                // set bot message to pending and resend
                setMessages(prev => prev.map(m => (m.id === failedBot.id ? { ...m, status: 'pending', text: '...' } : m)));
                await sendToBackend(failedBot.id, failedBot.originalPrompt);
              }}
           />
          
          
          ) : null}
        </View>
      );
    }

    // bot message
    return (
      <View style={[styles.bubble, styles.botBubble]}>
        {item.status === 'pending' ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : (
          <Text style={styles.botText}>{item.text}</Text>
        )}

        {/* bot-side inline retry removed; refresh icon is placed on the corresponding user message */}
      </View>
    );
  };

  return (
    <SafeAreaView  style={styles.container}> 

       <CustomHeader title="Chatbot" titleStyle={{ fontSize: 24 }} />
       <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
     
      <FlatList
        data={messages}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e1" />
            <Text style={styles.empty}>Start a conversation</Text>
            <Text style={styles.emptySubtitle}>Send a message to get started</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Type your message..."
            style={styles.input}
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
          />

          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isSending}>
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chatbot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  list: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    marginLeft: '25%',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    marginRight: '25%',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: '#1e293b',
    fontSize: 15,
    lineHeight: 20,
  },
  userRow: {
    // flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginLeft: '25%',
  },
  refreshButton: {
    // padding: 6,
    borderRadius: 20,
    marginRight: 30,
    
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
    
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    marginRight: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1e293b',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});