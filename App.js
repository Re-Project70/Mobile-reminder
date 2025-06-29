import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, TextInput, Button, View, FlatList, Alert,
  Platform, TouchableOpacity
} from 'react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function App() {
  const [jadwalKuliah, setJadwalKuliah] = useState('');
  const [tugas, setTugas] = useState('');
  const [items, setItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDateText, setSelectedDateText] = useState('');
  const [selectedTimeText, setSelectedTimeText] = useState('');

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izinkan aplikasi untuk mengirim notifikasi.');
      }
    };

    requestPermissions();
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log(notification);
    });

    return () => subscription.remove();
  }, []);

  const addItem = async () => {
    if (!jadwalKuliah.trim() && !tugas.trim()) {
      Alert.alert('Error', 'Masukkan jadwal kuliah atau tugas');
      return;
    }

    const newItem = {
      id: Math.random().toString(),
      jadwalKuliah,
      tugas,
      date: selectedDate.toString()
    };

    setItems(prevItems => [newItem, ...prevItems]);
    setJadwalKuliah('');
    setTugas('');
    setSelectedDateText('');
    setSelectedTimeText('');
    scheduleNotification(newItem);
  };

  const scheduleNotification = async (item) => {
    const trigger = new Date(item.date);

    if (trigger <= new Date()) {
      trigger.setMinutes(trigger.getMinutes() + 1);
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📚 ${item.jadwalKuliah}`,
          body: `📝 ${item.tugas} (Deadline: ${new Date(item.date).toLocaleString()})`,
        },
        trigger: {
          seconds: Math.max(Math.floor((trigger - new Date()) / 1000), 1),
        },
      });
    } catch (error) {
      console.error('Gagal menjadwalkan notifikasi:', error);
    }
  };

  const onChangeDate = (event, selected) => {
    setShowDatePicker(false);
    if (event?.type === "dismissed" || !selected) return;

    const newDate = new Date(selectedDate);
    newDate.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setSelectedDate(newDate);
    setSelectedDateText(newDate.toLocaleDateString());
  };

  const onChangeTime = (event, selected) => {
    setShowTimePicker(false);
    if (event?.type === "dismissed" || !selected) return;

    const newDate = new Date(selectedDate);
    newDate.setHours(selected.getHours(), selected.getMinutes(), 0);
    setSelectedDate(newDate);
    setSelectedTimeText(newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  };

  const deleteItem = (itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const checkExpiredTasks = () => {
    const now = new Date();
    setItems(prevItems =>
      prevItems.filter(item => {
        const itemDate = new Date(item.date);
        itemDate.setHours(itemDate.getHours() + 2);
        return itemDate > now;
      })
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiredTasks();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Pengingat Jadwal & Tugas Kuliah</Text>

      <TextInput
        style={styles.input}
        placeholder="Masukkan jadwal kuliah"
        value={jadwalKuliah}
        onChangeText={setJadwalKuliah}
      />

      <TextInput
        style={styles.input}
        placeholder="Masukkan tugas"
        value={tugas}
        onChangeText={setTugas}
      />

      <View style={styles.pickerRow}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerButton}>
          <Text style={styles.pickerButtonText}>Pilih Tanggal</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.pickerButton}>
          <Text style={styles.pickerButtonText}>Pilih Waktu</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          is24Hour={true}
          onChange={onChangeTime}
        />
      )}

      {(selectedDateText || selectedTimeText) && (
        <Text style={styles.selectedText}>
          📌 Deadline: {selectedDateText} {selectedTimeText}
        </Text>
      )}

      <Button title="Tambah ke Daftar" onPress={addItem} />

      <FlatList
        style={{ marginTop: 20 }}
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.bold}>🗓️ {item.jadwalKuliah}</Text>
            <Text>{item.tugas}</Text>
            <Text style={styles.dateText}>⏰ {new Date(item.date).toLocaleString()}</Text>
            <Button title="Hapus" onPress={() => deleteItem(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

// Style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderColor: '#CCC',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerButton: {
    flex: 0.48,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  pickerButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  selectedText: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: '#FFF',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    borderColor: '#DDD',
    borderWidth: 1,
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#555',
    marginVertical: 5,
  },
});
