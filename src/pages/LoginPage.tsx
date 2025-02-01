import LoginForm from "../components/login/LoginForm";
import AtlasBoard from "../components/login/AtlasBoard";

export default function LoginPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/2 flex items-center justify-center bg-white">
        <LoginForm />
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <AtlasBoard />
      </div>
    </div>
  );
}
