import { Elevation } from '@lib/elevation';
import { Enhancer } from '@lib/enhancer';
import { GPXParser } from '@lib/gpx';
import { MaxSpeedComputer } from '@lib/physics';
import { Path } from '@lib/types';
import { Bike, Cyclist } from '@lib/types/models';
import type { Ref } from 'vue';
import { ref } from 'vue';

export function useGPXDemo(): {
    currentPath: Ref<Path | null>;
    isProcessing: Ref<boolean>;
    statusText: Ref<string>;
    fileName: Ref<string>;
    loadGPXFile: (url: string) => Promise<void>;
    handleFileUpload: (file: File) => Promise<void>;
    fixElevation: () => Promise<void>;
    computeMaxSpeeds: () => Promise<void>;
    enhancePath: () => Promise<void>;
} {
    const currentPath: Ref<Path | null> = ref(null);
    const isProcessing = ref(false);
    const statusText = ref('');
    const fileName = ref('');

    const setProcessing = (processing: boolean, message = '') => {
        isProcessing.value = processing;
        statusText.value = message;
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
            currentPath.value = parsed.tracks[0];
            fileName.value = filename;

            console.log('GPX parsed successfully:', {
                filename,
                points: currentPath.value.getPointCount(),
                distance: currentPath.value.getTotalDistance(),
            });
        } catch (error) {
            throw new Error('Failed to parse GPX: ' + (error as Error).message);
        }
    };

    const fixElevation = async () => {
        if (isProcessing.value || !currentPath.value) {
            return;
        }

        setProcessing(true, 'Correcting elevation data...');

        try {
            const correctedPath = await Elevation.fixElevation(currentPath.value);
            currentPath.value = correctedPath as Path;
            fileName.value = 'Corrected GPX';

            console.log('Elevation correction completed');
        } catch (error) {
            console.error('Error fixing elevation:', error);
            throw error;
        } finally {
            setProcessing(false);
        }
    };

    const computeMaxSpeeds = async () => {
        if (isProcessing.value || !currentPath.value) {
            return;
        }

        setProcessing(true, 'Computing maximum speeds...');

        try {
            const cyclist = Cyclist.getDefault();
            const bike = Bike.getDefault();
            MaxSpeedComputer.computeMaxSpeeds({
                path: currentPath.value as Path,
                cyclist,
                bike,
            });

            console.log('Max speeds computed successfully');
        } catch (error) {
            console.error('Error computing max speeds:', error);
            throw error;
        } finally {
            setProcessing(false);
        }
    };

    const enhancePath = async () => {
        if (isProcessing.value || !currentPath.value) {
            return;
        }

        setProcessing(true, 'Enhancing path with virtual cyclist...');

        try {
            currentPath.value = await Enhancer.enhancePath(currentPath.value);

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
        fixElevation,
        computeMaxSpeeds,
        enhancePath,
    };
}
