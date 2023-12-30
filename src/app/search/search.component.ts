// src/app/search/search.component.ts

import { Component, OnInit } from '@angular/core';
import { SearchService } from '../search.service';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { OSM, Vector as VectorSource } from 'ol/source';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature.js';
import { HttpClient } from '@angular/common/http';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {FormControl} from '@angular/forms';
import { startWith, map, switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {defaults as defaultControls, Attribution} from 'ol/control.js';

export interface GeoName {
  geonameid: number;
  name: string;
  asciiname: string;
  alternatenames: string;
  latitude: number;
  longitude: number;
  feature_class: string;
  feature_code: string;
  country_code: string;
  cc2: string;
  admin1_code: string;
  admin2_code: string;
  admin3_code: string;
  admin4_code: string;
  population: number;
  elevation: number;
  dem: string;
  timezone: string;
  modification_date: string;
}
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  query: string = '';
  results: any;
  map!: Map; // Definite assignment assertion
  vectorLayer!: VectorLayer<VectorSource>;
  vectorSource!: VectorSource;
  myControl = new FormControl();
  options: GeoName[] = [];
  filteredOptions: Observable<GeoName[]> = of([] as GeoName[]);

  constructor(private searchService: SearchService) {
    
  }

  ngOnInit(): void {
    this.initMap();
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        const filterValue = (typeof value === 'string' ? value : (value as GeoName)?.name || '').toLowerCase();
        return of(filterValue ? this._filter(filterValue) : this.options.slice() as GeoName[]);
      }),
      map(result => result as GeoName[]) // Use map to specify the return type
    );
  }
  
  private _filter(value: string): GeoName[] {
  const filterValue = value.toLowerCase();
  this.searchService.search(filterValue).subscribe(
    response => {
      this.options = response;
    },
    error => {
      console.error('Error:', error);
    }
  );
  console.log(this.options)
  return this.options;
  }

  initMap(): void {
    this.vectorSource = new VectorSource();

    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
    });
    const attribution = new Attribution({
      collapsible: false,
    });
    
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        this.vectorLayer,
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2
      }),
      //controls: defaultControls({attribution: true})
      //controls: defaultControls({attribution: true}).extend([attribution]),
    });

    
  }

  search(): void {
    this.searchService.searchOne(this.query).subscribe(
      response => {
        this.results = response;
        const firstResult = this.results;
        if (firstResult) {
          const coords = [firstResult.longitude, firstResult.latitude];
          this.map.getView().setCenter(fromLonLat(coords));
          this.map.getView().setZoom(12);
          const iconFeature = new Feature({
            geometry: new Point(fromLonLat(coords)),
            name: 'Null Island',
            population: 4000,
            rainfall: 500,
          });
          const iconStyle = new Style({
            image: new Icon({
              anchor: [0.5, 1],
              anchorXUnits: 'fraction',
              anchorYUnits: 'pixels',
              src: 'assets/a.png',
            }),
          });
          iconFeature.setStyle(iconStyle);
          const vectorSource = this.vectorLayer.getSource();
          vectorSource!.clear();
          vectorSource!.addFeature(iconFeature);
          vectorSource!.changed(); // Trigger a redraw of the vector layer
        }
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  displayFn(option: GeoName): string {
    return option ? option.name : '';
  }
  /*
  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedName: string = event.option.value.name;
    // Perform your search with the selected name
    this.query = selectedName;
    this.search()
  }
  */

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedName: string = event.option.value.name;
    // Subscribe to the filteredOptions observable
    this.filteredOptions.subscribe(options => {
      const filteredOption = options.find(option => option.name === selectedName);
      this.results = filteredOption;
      console.log("filteredOption",filteredOption)
      // Perform your logic with the filtered option
      if (filteredOption) {
        // Do something with the filtered option
          const firstResult = filteredOption;
          const coords = [firstResult.longitude, firstResult.latitude];
          this.map.getView().setCenter(fromLonLat(coords));
          this.map.getView().setZoom(12);
          // Create an icon feature with the specified image path
          const iconFeature = new Feature({
            geometry: new Point(fromLonLat(coords)),
            name: 'Null Island',
            population: 4000,
            rainfall: 500,
          });

          const iconStyle = new Style({
            image: new Icon({
              anchor: [0.5, 1],
              anchorXUnits: 'fraction',
              anchorYUnits: 'pixels',
              src: 'assets/a.png',
            }),
          });

          iconFeature.setStyle(iconStyle);

          // Clear previous features and add the new icon feature
          const vectorSource = this.vectorLayer.getSource();
          vectorSource!.clear();
          vectorSource!.addFeature(iconFeature);
          vectorSource!.changed(); // Trigger a redraw of the vector layer
      }
    });
  }
  
}
