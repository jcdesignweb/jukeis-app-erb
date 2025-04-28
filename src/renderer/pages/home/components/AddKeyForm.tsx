import React, { useState } from 'react';

const AddKeyForm: React.FC = () => {
  const [description, setDescription] = useState('');
  const [key, setKey] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (description && key) {
      window.electron.ipcRenderer.sendNewKey({ description, key });
      setDescription('');
      setKey('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="description">Descripción:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="key">Clave:</label>
        <input
          type="text"
          id="key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </div>
      <button type="submit">Agregar Clave</button>
    </form>
  );
};

export default AddKeyForm;
