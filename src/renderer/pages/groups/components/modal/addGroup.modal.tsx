import { Form, Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { t } from 'i18next';
import { v4 as uuidv4 } from 'uuid';
import { Group } from '../../../../../main/data/storage';

export type AddGroupModalProps = {
  isModalOpen: boolean;
  handleOk: () => void;
  onComplete: (status: boolean) => void;
};

interface FormAddNewValues {
  group: string;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({
  isModalOpen,
  handleOk,
  onComplete,
}) => {
  const [error, setError] = useState('');
  // const inputRef = useRef<InputRef>(null);

  const [form] = Form.useForm();

  const handleSubmit = async (values: FormAddNewValues) => {
    const newGroup: Group = {
      id: uuidv4(),
      name: values.group,
    };

    try {
      await window.electron.ipcRenderer.invoke<Group[]>('add-group', newGroup);

      handleOk();
    } catch (error: any) {
      console.error(error);

      const message = error.message || error.toString();

      if (message.includes('Group Alredy exists')) {
        setError(t('modal.group-creator.group-exists'));
      }
    }
  };

  const handleOkModal = () => {
    form.submit();
  };

  const close = () => {
    onComplete(false);
  };

  useEffect(() => {
    setError('');
    if (!isModalOpen) {
      form.resetFields();
    }
  }, [isModalOpen, form]);

  return (
    <Modal
      title={t('modal.creator.title')}
      open={isModalOpen}
      onOk={handleOkModal}
      onCancel={() => onComplete(false)}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        initialValues={{ layout: 'verical' }}
      >
        <Form.Item
          label={t('modal.group-creator.group')}
          name="group"
          style={{ width: '100%' }}
          rules={[
            {
              required: true,
              message: t('modal.group-creator.group-required'),
            },
          ]}
        >
          <Input />
        </Form.Item>

        {error && <span style={{ color: 'red' }}>{error}</span>}
      </Form>
    </Modal>
  );
};
