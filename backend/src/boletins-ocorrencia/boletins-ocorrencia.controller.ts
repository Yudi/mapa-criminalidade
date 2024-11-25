import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { BoletinsOcorrenciaService } from 'src/boletins-ocorrencia/boletins-ocorrencia.service';

@Controller('boletins-ocorrencia')
export class BoletinsOcorrenciaController {
  constructor(
    private readonly boletinsOcorrenciaService: BoletinsOcorrenciaService,
  ) {}

  //         `/boletins-ocorrencia/query-rubrica-in-location?lat=${lat}&lon=${lon}&radius=${radius}&before=${before}&after=${after}&rubrica=${rubrica}`,
  @Get('/query-rubrica-in-location')
  @ApiQuery({
    name: 'lon',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'lat',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'radius',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'after',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'rubrica',
    required: true,
    type: String,
  })
  queryRubricaInLocation(
    @Query('lon') lon: string,
    @Query('lat') lat: string,
    @Query('radius') radius: string,
    @Query('before') before: string,
    @Query('after') after: string,
    @Query('rubrica') rubrica: string,
  ) {
    const parsedLon = parseFloat(lon);
    const parsedLat = parseFloat(lat);
    const parsedRadius = parseInt(radius);

    if (!parsedLon || !parsedLat || !parsedRadius) {
      throw new HttpException('Missing required query parameters', 400);
    }
    return this.boletinsOcorrenciaService.getBoletinsByRubricaInRange(
      parsedLon,
      parsedLat,
      parsedRadius,
      before,
      after,
      rubrica,
    );
  }

  @Get('/query-rubricas-for-location')
  @ApiQuery({
    name: 'lon',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'lat',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'radius',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'after',
    required: false,
    type: String,
  })
  queryRubricasForLocation(
    @Query('lon') lon: string,
    @Query('lat') lat: string,
    @Query('radius') radius: string,
    @Query('before') before: string,
    @Query('after') after: string,
  ) {
    const parsedLon = parseFloat(lon);
    const parsedLat = parseFloat(lat);
    const parsedRadius = parseInt(radius);

    if (!parsedLon || !parsedLat || !parsedRadius) {
      throw new HttpException('Missing required query parameters', 400);
    }
    return this.boletinsOcorrenciaService.listRubricasInRange(
      parsedLon,
      parsedLat,
      parsedRadius,
      before,
      after,
    );
  }

  @Get('/query-point')
  @ApiQuery({
    name: 'lon',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'lat',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'radius',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'after',
    required: false,
    type: String,
  })
  queryLocation(
    @Query('lon') lon: string,
    @Query('lat') lat: string,
    @Query('radius') radius: string,
    @Query('before') before: string,
    @Query('after') after: string,
  ) {
    const parsedLon = parseFloat(lon);
    const parsedLat = parseFloat(lat);
    const parsedRadius = parseInt(radius);

    if (!parsedLon || !parsedLat || !parsedRadius) {
      throw new HttpException('Missing required query parameters', 400);
    }
    return this.boletinsOcorrenciaService.findInRange(
      parsedLon,
      parsedLat,
      parsedRadius,
      before,
      after,
    );
  }
}
