import {ElectronAPI} from "../../shared/models/channels-payloads";

// @ts-ignore
export const getElectronAPI = () : ElectronAPI  => window.electronAPI;
