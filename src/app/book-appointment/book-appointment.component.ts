import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-book-appointment',
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.sass'],
})
export class BookAppointmentComponent implements OnInit {
  db: any;
  name: string;
  description: string;
  slotTimestamp;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.slotTimestamp = params.timestamp;
    });
  }

  ngOnInit(): void {
    let openDb = window.indexedDB.open('appointmetApp', 1);
    openDb.addEventListener('error', () => {
      console.error('Database failed to open');
    });

    openDb.addEventListener('upgradeneeded', (e: any) => {
      this.router.navigate(['']);
    });

    openDb.addEventListener('success', (e: any) => {
      this.db = e.target.result;
    });
  }
  submit() {
    if (!this.name || !this.description) {
      alert('Please fill Patient name and Health Issue details');
      return;
    }

    let transaction = this.db.transaction('appointments', 'readwrite');
    let objectStore = transaction.objectStore('appointments');
    const addRequest = objectStore.put({
      timestamp: this.slotTimestamp,
      name: this.name,
      description: this.description,
    });

    addRequest.addEventListener('success', () => {
      console.log('appointment bookeed successfully');
      this.router.navigate(['']);
    });
  }

  cancel() {
    this.router.navigate(['']);
  }
}
