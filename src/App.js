import './App.css';
import FileUpload from './FileUpload';

function App() {
  return (
    <div className="App">
      <header className=" align-top">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Data Handling App
            </h2>
            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
              <h2>Upload Your File Below:
              </h2>
            </div>
          </div>
        </div>
      </header>
      <FileUpload/>
    </div>
  );
}

export default App;
