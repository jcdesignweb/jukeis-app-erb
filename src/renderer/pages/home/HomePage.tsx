import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { Group, StoredData, StoreKey } from '../../../main/data/storage';
import { AddKeyModal } from './components/modal/addKey.modal';
import KeyList from './components/KeyList';

import './HomePage.css';
import { useDataContext } from '../../contexts/DataContext';

interface HomeScreenProps {}

const HomePage: React.FC<HomeScreenProps> = () => {
  const { state, refresh } = useDataContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onComplete = (status: boolean) => {
    setIsModalOpen(false);

    refresh();
  };
  const handleAddKeyClick = () => {
    setIsModalOpen(true);
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={handleAddKeyClick}
        style={{ float: 'right' }}
      >
        {useTranslation().t('addKey')}
      </Button>
      <br />
      <AddKeyModal
        isModalOpen={isModalOpen}
        groups={state.groups}
        onComplete={onComplete}
      />
      <h2 style={{ marginTop: 24 }}>{useTranslation().t('home.title')}</h2>
      <KeyList />
    </div>
  );
};

export default HomePage;
