import Constants from 'expo-constants';

/**
 * Central configuration for the backend API.
 * This dynamically determines the backend IP based on the Expo host.
 */

// Get the IP address of the machine running the Expo packager
const debuggerHost = Constants.expoConfig?.hostUri;
const hostIP = debuggerHost ? debuggerHost.split(':')[0] : '10.172.87.157';

export const BACKEND_IP = hostIP;
export const BACKEND_PORT = '3000';

export const BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api/`;
// export const BASE_URL = `https://dairy-farm-jvyh.onrender.com/api/`;

console.log('API Base URL:', BASE_URL);
