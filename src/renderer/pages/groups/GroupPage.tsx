import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import GroupList from './components/GroupList';
import { AddGroupModal } from './components/modal/addGroup.modal';
import { useDataContext } from '../../contexts/DataContext';

interface GroupScreenProps {}

const GroupPage: React.FC<GroupScreenProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refresh } = useDataContext();

  const handleAddGroupOk = () => {
    setIsModalOpen(false);
    refresh();
  };

  const handleAddGroupOnClick = () => {
    setIsModalOpen(true);
  };

  const handleAddGroupCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div id="group-page">
      <Button
        type="primary"
        onClick={handleAddGroupOnClick}
        style={{ float: 'right' }}
      >
        {useTranslation().t('groups.addGroupButton')}
      </Button>
      <br />

      <AddGroupModal
        isModalOpen={isModalOpen}
        handleOk={handleAddGroupOk}
        onComplete={handleAddGroupCancel}
      />

      <h2 style={{ marginTop: 24 }}>{useTranslation().t('groups.title')}</h2>
      <GroupList />
    </div>
  );
};

export default GroupPage;
