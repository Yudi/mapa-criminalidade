import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnChanges,
  SimpleChanges,
  WritableSignal,
  inject,
} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { getPointResolution, transform, useGeographic } from 'ol/proj';

import Feature from 'ol/Feature';
import { Circle as OlCircle, Point } from 'ol/geom';
import { HttpClient } from '@angular/common/http';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { take } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FormGroup } from '@angular/forms';
import DataFormValues from '../../shared/dataForm.interface';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { Observable } from 'rxjs';
import { ObjectHandlingService } from '../../shared/object-handling.service';
import { BoletimOcorrencia } from '../../shared/schema.interface';
import Collection from 'ol/Collection';
import BaseLayer from 'ol/layer/Base';
import { ProgressBarService } from '../../shared/progressbar.service';
import { MapMarkersService } from '../../shared/map-markers.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) response!: Observable<BoletimOcorrencia[] | null>;
  @Input({ required: true }) addressCenter!: {
    lon: number | null;
    lat: number | null;
    radius: number | null;
    before: string | null;
    after: string | null;
  };
  @Input({ required: true }) rubricasFormValues:
    | { [key: string]: boolean }
    | undefined;
  @Input({ required: true })
  showIndeterminateProgressBar!: WritableSignal<boolean>;
  @Input({ required: true }) progressBarPercentage!: WritableSignal<number>;

  private objectHandlingService = inject(ObjectHandlingService);
  private progressBarService = inject(ProgressBarService);
  private markersService = inject(MapMarkersService);

  map: Map | undefined | null;
  vectorSource: VectorSource = new VectorSource({});
  vectorLayer: VectorLayer = new VectorLayer({
    source: this.vectorSource,
  });
  centerPin: Feature | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['addressCenter']) {
      const prevValue = changes['addressCenter'].previousValue;
      const currentValue = changes['addressCenter'].currentValue;
      // Perform a deep comparison if it's an object
      if (
        !this.objectHandlingService.areObjectsEqual(prevValue, currentValue)
      ) {
        this.handleFormSubmit();
      }
    }

    if (changes['rubricasFormValues']) {
      if (this.rubricasFormValues) {
        this.onRubricasFormChange(this.rubricasFormValues);
      }
    }
  }

  onRubricasFormChange(rubricasFormValues: { [key: string]: boolean }) {
    this.progressBarPercentage.set(0);
    const values = rubricasFormValues;
    const rubricas = Object.keys(values);

    // For all false values, remove features

    this.response.pipe(take(1)).subscribe((responseData) => {
      this.progressBarPercentage.set(10);
      const mapLayers = this.map?.getLayers();

      rubricas.forEach((rubrica) => {
        // For all true values, generate features
        if (values[rubrica]) {
          this.generateFeaturesLayerForRubrica(rubrica, responseData);
        } else {
          this.removeRubricaLayerFeatures(rubrica, mapLayers);
        }
      });
      this.progressBarPercentage.set(-1);
    });
  }

  removeRubricaLayerFeatures(
    rubrica: string,
    mapLayers: Collection<BaseLayer> | undefined,
  ) {
    if (!mapLayers) {
      return;
    }

    mapLayers.forEach((layer) => {
      if (layer instanceof VectorLayer && layer.get('rubrica') === rubrica) {
        layer.getSource()?.clear();
      }
    });
  }

  generateFeaturesLayerForRubrica(
    rubrica: string,
    responseData: BoletimOcorrencia[] | null,
  ) {
    if (!responseData) {
      return;
    }

    // Get all existing layers by rubrica
    const layersByType: { [key: string]: VectorLayer } = {};

    this.map?.getLayers().forEach((layer) => {
      if (layer instanceof VectorLayer) {
        layersByType[layer.get('rubrica')] = layer;
      }
    });

    console.log(layersByType);

    // If current rubrica layer does not exist, create it
    if (!layersByType[rubrica]) {
      layersByType[rubrica] = new VectorLayer({
        source: this.vectorSource,
        style: new Style({
          image: new Icon({
            anchor: [0.5, 1],
            scale: 0.2,
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: `${environment.baseUrl}/${this.markersService.markerChooser(rubrica)}`,
          }),
        }),
      });
      layersByType[rubrica].set('rubrica', rubrica); // Set the rubrica name as a property
      this.map?.addLayer(layersByType[rubrica]); // Add the new layer to the map
      console.log(this.markersService.markerChooser(rubrica));
    }

    // Generate features for the rubrica
    const features = responseData
      .filter((bo) => bo.rubrica === rubrica)
      .map((bo) => {
        if (!bo || !bo.rubrica || !bo.longitude || !bo.latitude) {
          return;
        }

        if (bo.longitude !== null && bo.latitude !== null) {
          const coordinates = [bo.longitude, bo.latitude];

          const feature = new Feature({
            geometry: new Point(coordinates),
          });
          this.progressBarService.addToProgressBar(
            1,
            this.progressBarPercentage,
          );

          return feature;
        }
        return;
      });

    // Add features to the layer
    layersByType[rubrica].getSource()?.addFeatures(features);
  }

  handleFormSubmit() {
    this.showIndeterminateProgressBar.set(false);

    this.updateCenter(
      this.addressCenter.lon!,
      this.addressCenter.lat!,
      this.addressCenter.radius!,
    );
  }

  updateCenter(lon: number, lat: number, radius: number) {
    const coordinates = [lon, lat];
    this.vectorSource?.clear(); // Clear previous features
    this.map?.getView().setCenter(coordinates);

    // If map zoom is less than 16, zoom in
    if (this.map?.getView().getZoom()! < 10) {
      this.map?.getView().setZoom(16);
    }

    // if radius, draw circle to represent the radius
    if (radius && radius !== -1) {
    }
  }

  generateFeatures() {}

  ngAfterViewInit() {
    // Marco Zero, Praça da Sé, São Paulo
    const defaultCoordinates = [-46.63394714, -23.5503953];

    useGeographic();
    const rasterLayer = new TileLayer({
      source: new OSM(),
    });

    setTimeout(() => {
      this.map = new Map({
        view: new View({
          center: defaultCoordinates,
          zoom: 16,
          maxZoom: 19,
          projection: 'EPSG:3857',
        }),
        layers: [rasterLayer, this.vectorLayer!],
        target: 'ol-map-tab',
      });
    }, 500);
  }
}
