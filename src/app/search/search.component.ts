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
  countryCodes = [
    'AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY',
    'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY',
    'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM',
    'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE',
    'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID',
    'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS',
    'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MK', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD',
    'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MP', 'NO', 'OM',
    'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC',
    'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES',
    'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV',
    'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW'
  ];
  countryCodeControl = new FormControl();
  constructor(private searchService: SearchService) {
    
  }

  ngOnInit(): void {
    this.initMap();
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        const filterValue = (typeof value === 'string' ? value : (value as GeoName)?.name || '').toLowerCase();
        const countryCode = this.countryCodeControl.value;
        if (filterValue.length >= 3) {
          return of(filterValue ? this._filter(filterValue, countryCode) : this.options.slice() as GeoName[]);
        } else {
          // If less than three characters, return an empty array or any default options
          return of([] as GeoName[]);
        }
      }),
      map(result => result as GeoName[]) // Use map to specify the return type
    );
  }
  
  private _filter(value: string, countryCode: string): GeoName[] {
  const filterValue = value.toLowerCase();
  this.searchService.search(filterValue, countryCode).subscribe(
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
      })
    });

    
  }

  displayFn(option: GeoName): string {
    return option ? option.name : '';
  }

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
