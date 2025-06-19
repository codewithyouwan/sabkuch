import toast, { Toaster } from 'react-hot-toast';
export default function CustomToaster() {
    return (
    <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: 'white',
            border: '1px gray solid',
            borderRadius: '100px',
            padding: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: {
            style: {
              borderColor: '#10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            style: {
              borderColor: '#ef4444',
              color: '#ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />
    );
}