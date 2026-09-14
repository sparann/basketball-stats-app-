import { useNavigate } from 'react-router-dom';
import { useData } from '../context/data-context';
import AdminLogin from '../components/AdminLogin';
import AdminPanel from '../components/AdminPanel';
import PageHeader from '../components/ui/PageHeader';

const AdminPage = () => {
  const navigate = useNavigate();
  const data = useData();

  if (!data.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Admin" />
        <AdminLogin onLogin={data.login} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Admin" />
      <AdminPanel
        onLogout={() => {
          data.logout();
          navigate('/');
        }}
        onSessionAdded={data.refresh}
        playerStats={data.players}
        onUpdatePlayer={data.updatePlayer}
        onDeletePlayer={data.deletePlayer}
        sessions={data.sessions}
        locations={data.locations}
        onAddLocation={data.addLocation}
        onEditLocation={data.editLocation}
        onRemoveLocation={data.removeLocation}
        onDeleteSession={data.refresh}
      />
    </div>
  );
};

export default AdminPage;
