import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { Group, StoredData, StoreKey } from '../../main/models';

interface State {
  keys: StoreKey[];
  groups: Group[];
  loading: boolean;
  error?: string;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: { keys: StoreKey[]; groups: Group[] } }
  | { type: 'LOAD_ERROR'; payload: string };

const initialState: State = { keys: [], groups: [], loading: true };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true };
    case 'LOAD_SUCCESS':
      return {
        keys: action.payload.keys,
        groups: action.payload.groups,
        loading: false,
      };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

interface DataContextValue {
  state: State;
  refresh: () => void;
}

const DataContext = createContext<DataContextValue>({
  state: initialState,
  refresh: () => {},
});

export const KeysProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = async () => {
    try {
      dispatch({ type: 'LOAD_START' });
      const loadedData: StoredData =
        await window.electron.ipcRenderer.invoke('load-keys');
      dispatch({ type: 'LOAD_SUCCESS', payload: loadedData });
    } catch (e: unknown) {
      let message = 'Unknown error';
      if (e instanceof Error) {
        message = e.message;
      } else {
        console.error('unkown error', e);
      }

      dispatch({ type: 'LOAD_ERROR', payload: message });
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DataContext.Provider value={{ state, refresh: load }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => useContext(DataContext);
