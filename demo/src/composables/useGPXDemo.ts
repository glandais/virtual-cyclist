import {
    CyclistPowerProvider,
    PowerProviderConstant,
    PowerProviderConstantWithTiring,
    powerProviderFromData,
} from '@/physics';
import { Enhancer } from '@lib/enhancer';
import { GPXParser } from '@lib/gpx';
import { aeroProviderConstant } from '@lib/physics/power/aero/aero';
import { rhoProviderEstimate } from '@lib/physics/power/aero/rho';
import { WindProviderConstant } from '@lib/physics/power/aero/wind';
import type { CoursePhysics, EnhanceOptions } from '@lib/types/course';
import { Bike, BikeProperties, Cyclist, CyclistProperties } from '@lib/types/models';
import { Path } from '@lib/types/path';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { PowerParams, PowerSourceType, WindDemo } from '~/types';

export function useGPXDemo(
    bike: Ref<BikeProperties>,
    cyclist: Ref<CyclistProperties>,
    wind: Ref<WindDemo>,
    enhanceOptions: Ref<EnhanceOptions>,
    powerParams: Ref<PowerParams>
): {
    currentPath: Ref<Path | null>;
    isProcessing: Ref<boolean>;
    statusText: Ref<string>;
    fileName: Ref<string>;
    loadGPXFile: (url: string) => Promise<void>;
    handleFileUpload: (file: File) => Promise<void>;
    enhancePath: () => Promise<void>;
} {
    const originalPath: Ref<Path | null> = ref(null);
    const currentPath: Ref<Path | null> = ref(null);
    const isProcessing = ref(false);
    const statusText = ref('');
    const fileName = ref('');

    const setProcessing = (processing: boolean, message = '') => {
        isProcessing.value = processing;
        statusText.value = message;
    };

    const getCourse = (path: Path): CoursePhysics => {
        const powerParamsValue = powerParams.value;
        let powerProvider: CyclistPowerProvider;
        switch (powerParamsValue.type) {
            case PowerSourceType.constant:
                powerProvider = new PowerProviderConstant(
                    powerParamsValue.power,
                    powerParamsValue.useHarmonics
                );
                break;
            case PowerSourceType.constant_tiring:
                powerProvider = new PowerProviderConstantWithTiring(
                    powerParamsValue.power,
                    powerParamsValue.useHarmonics,
                    powerParamsValue.tiringDuration
                );
                break;
            case PowerSourceType.source:
                powerProvider = powerProviderFromData;
                break;
            default:
                powerProvider = new PowerProviderConstant(
                    powerParamsValue.power,
                    powerParamsValue.useHarmonics
                );
        }
        return {
            path,
            bike: Bike.getBike(bike.value),
            cyclist: Cyclist.getCyclist(cyclist.value),
            rhoProvider: rhoProviderEstimate,
            aeroProvider: aeroProviderConstant,
            windProvider: new WindProviderConstant(wind.value),
            cyclistPowerProvider: powerProvider,
        };
    };

    const loadGPXFile = async (url: string) => {
        if (isProcessing.value) {
            return;
        }

        setProcessing(true, 'Loading GPX file...');

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load GPX: ${response.status} ${response.statusText}`);
            }

            const gpxContent = await response.text();
            await parseGPX(gpxContent, url.split('/').pop() || 'Unknown');
        } catch (error) {
            console.error('Error loading GPX file:', error);
            throw error;
        } finally {
            setProcessing(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (isProcessing.value) {
            return;
        }

        setProcessing(true, 'Reading uploaded file...');

        try {
            const content = await file.text();
            await parseGPX(content, file.name);
        } catch (error) {
            console.error('Error handling file upload:', error);
            throw error;
        } finally {
            setProcessing(false);
        }
    };

    const parseGPX = async (gpxContent: string, filename: string) => {
        setProcessing(true, 'Parsing GPX data...');

        try {
            const parsed = GPXParser.parse(gpxContent);
            const loadedPath = parsed.tracks[0];
            originalPath.value = loadedPath;
            currentPath.value = loadedPath;
            fileName.value = filename;

            console.log('GPX parsed successfully:', {
                filename,
                points: loadedPath.getPointCount(),
                distance: loadedPath.getTotalDistance(),
            });
        } catch (error) {
            throw new Error('Failed to parse GPX: ' + (error as Error).message);
        }
    };

    const enhancePath = async () => {
        if (isProcessing.value || !originalPath.value) {
            return;
        }

        setProcessing(true, 'Enhancing path with virtual cyclist...');

        try {
            const course = getCourse(originalPath.value);
            currentPath.value = await Enhancer.enhanceCourse(course, enhanceOptions.value);

            console.log('Path enhancement completed');
        } catch (error) {
            console.error('Error enhancing path:', error);
            throw error;
        } finally {
            setProcessing(false);
        }
    };

    return {
        currentPath,
        isProcessing,
        statusText,
        fileName,
        loadGPXFile,
        handleFileUpload,
        enhancePath,
    };
}
