import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.sass'],
})
export class AppointmentsComponent implements OnInit {
  readonly arbitoryDateTime = '1/1/2000 10:00:00';
  totalSlotsDaily = 20;
  slotSizeInMin = 20;
  slots = [];
  currentWeek = 0;
  week;
  fullWeekAppointments = [];
  appointments = [];
  weekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednessday',
    'Thursday',
    'Friday',
    'Satarday',
  ];
  preSelectedWeekDays = [];
  db;
  constructor(private route: Router) {}
  generateSlots() {
    this.slots = [];
    const arbitory = new Date(Date.parse(this.arbitoryDateTime));
    for (let i = 0; i < this.totalSlotsDaily; i++) {
      const slotTime = arbitory.setMinutes(
        arbitory.getMinutes() + this.slotSizeInMin * i
      );
      this.slots.push(new Date(slotTime).toLocaleString());
    }
  }
  generateWeek() {
    let today = new Date();
    this.week = [];
    for (let i = 0; i < this.weekDays.length; i++) {
      this.week.push({
        weekDay: (today.getDay() + i) % this.weekDays.length,
        date: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + i + this.weekDays.length * this.currentWeek
        ).toDateString(),
      });
    }
  }
  ngOnInit(): void {
    let openDb = window.indexedDB.open('appointmetApp', 1);
    let db;
    openDb.addEventListener('error', () => {
      console.error('Database failed to open');
    });

    openDb.addEventListener('upgradeneeded', (e: any) => {
      db = e.target.result;
      const workingDays = db.createObjectStore('workingDays', {
        keyPath: 'dayName',
        autoIncrement: false,
      });
      workingDays.createIndex('dayName', 'dayName', { unique: true });

      const appointments = db.createObjectStore('appointments', {
        keyPath: 'timestamp',
        autoIncrement: false,
      });
      appointments.createIndex('timestamp', 'timestamp', { unique: true });
      appointments.createIndex('name', 'name', { unique: false });
      appointments.createIndex('description', 'description', { unique: false });
      console.log('Database setup complete');
    });

    openDb.addEventListener('success', (e: any) => {
      this.db = e.target.result;
      this.getAppointments();
      this.getWeekDays();
    });
  }

  generateFullWeekAppointments() {
    this.fullWeekAppointments = [];
    let day;
    let slot;
    for (let i = 0; i < this.weekDays.length; i++) {
      this.fullWeekAppointments[i] = [];
      day = this.week[i].date;
      for (let j = 0; j < this.totalSlotsDaily; j++) {
        slot = this.slots[j];
        const dd = new Date(day).getDate();
        const MM = new Date(day).getMonth();
        const yyyy = new Date(day).getFullYear();
        const hh = new Date(Date.parse(slot)).getHours();
        const mm = new Date(Date.parse(slot)).getMinutes();
        this.fullWeekAppointments[i][j] = Date.parse(
          dd + '/' + MM + '/' + yyyy + ' ' + hh + ':' + mm
        );
      }
    }
  }

  getWeekDays() {
    let transaction = this.db.transaction('workingDays', 'readwrite');
    let objectStore = transaction.objectStore('workingDays');

    if ('getAll' in objectStore) {
      objectStore.getAll().onsuccess = (event) => {
        this.preSelectedWeekDays = event.target.result.map(
          (obj) => obj.dayName
        );
        if (this.preSelectedWeekDays.length === 0) {
          this.preSelectedWeekDays = this.weekDays;
          this.fillIndexDBForAllDays(objectStore);
        }
      };
    } else {
      objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          console.log('check what to do with', cursor);
        } else {
          this.fillIndexDBForAllDays(objectStore);
        }
      };
    }
  }

  getAppointments() {
    let transaction = this.db.transaction('appointments', 'readonly');
    let objectStore = transaction.objectStore('appointments');

    if ('getAll' in objectStore) {
      objectStore.getAll().onsuccess = (event) => {
        this.appointments = event.target.result;
        this.generateWeek();
        this.generateSlots();
        this.generateFullWeekAppointments();
        console.log('all appointments', event.target.result);
      };
    }
  }

  hasAppointment(timestamp): boolean {
    return this.appointments.some(
      (item) => Number(item.timestamp) === timestamp
    );
  }
  bookAppointment(timestamp) {
    this.route.navigate(['book-appointment'], {
      queryParams: {
        timestamp: timestamp,
      },
    });
  }

  daySelectionChanged(day, isChecked) {
    let transaction = this.db.transaction('workingDays', 'readwrite');
    let objectStore = transaction.objectStore('workingDays');
    if (isChecked) {
      objectStore.put({
        dayName: day,
      }).onsuccess = () => {
        this.getWeekDays();
        this.generateWeek();
      };
    } else {
      objectStore.delete(day).onsuccess = () => {
        this.getWeekDays();
        this.generateWeek();
      };
    }
  }

  fillIndexDBForAllDays(objectStore) {
    this.weekDays.forEach((day) => {
      const addRequest = objectStore.add({
        dayName: day,
      });

      addRequest.addEventListener('success', () => {
        console.log('added successfully in indexedDB', day);
      });
    });
  }
}
