import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from '../src/components/LoginForm';
import { AuthProvider } from '../src/context/AuthContext';

const meta: Meta<typeof LoginForm> = {
  title: 'Components/LoginForm',
  component: LoginForm,
  decorators: [
    (Story) => (
      <AuthProvider>
        <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
          <Story />
        </div>
      </AuthProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithSuccessCallback: Story = {
  args: {
    onSuccess: () => console.log('Login successful!'),
  },
};
