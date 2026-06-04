import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
            <span className="text-9xl font-black text-brand-green opacity-20 select-none">404</span>
            <h1 className="text-3xl font-bold -mt-8 text-gray-900">Página não encontrada</h1>
            <p className="text-gray-500 mt-4 text-center max-w-sm">
                O caminho que você tentou acessar não existe ou foi removido para outra carteira.
            </p>
            <Link
                to="/dashboard"
                className="mt-8 bg-brand-green hover:bg-brand-green-hover text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20 cursor-pointer text-center"
            >
                Voltar ao Início
            </Link>
        </div>
    );
}