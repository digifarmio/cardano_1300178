import { FieldData } from '../../types/geonft.types';

export class GeoNftProcessor {
  validateAndTransform(data: unknown): Promise<FieldData> {
    return Promise.resolve({} as FieldData);
  }
}
