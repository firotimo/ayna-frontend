// src/app/search.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private rapidApiKey = '6a41403a8dmsh8898c2340dbfb77p1e19a1jsn77590d3f64f5';
  private rapidApiBaseUrl = 'http://127.0.0.1:8000/geonames/';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-RapidAPI-Host': 'getcity4.p.rapidapi.com',
      'X-RapidAPI-Key': this.rapidApiKey
    });
  }

  search(cityName: string): Observable<any> {
    const apiUrl = `${this.rapidApiBaseUrl}`;
    const headers = this.getHeaders();

    // Use HttpParams to set query parameters
    const params = new HttpParams().set('city_name', cityName);

    return this.http.get(apiUrl, { ...headers, params });
  }

  searchOne(query: string): Observable<any> {
    const apiUrl = `${this.rapidApiBaseUrl}getone/${encodeURIComponent(query)}`;
    const headers = this.getHeaders();

    return this.http.get(apiUrl, { headers });
  }
}
