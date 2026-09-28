import React, { useState } from 'react';
import { 
  Search, MapPin, ExternalLink, Globe, Sparkles, RefreshCw, 
  AlertCircle, Compass, Building, Fuel, Navigation, Shield
} from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../../services/firebase';

export const GroundingHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'maps'>('search');

  // Search Grounding state
  const [searchQuery, setSearchQuery] = useState('Current commercial truck border wait times at Ambassador Bridge and Blue Water Bridge');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<Array<{ title: string; uri: string }>>([]);

  // Maps Grounding state
  const [mapsQuery, setMapsQuery] = useState('Truck stops with CAT scale and overnight diesel parking near London, Ontario');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResult, setMapsResult] = useState<string | null>(null);
  const [mapsPlaces, setMapsPlaces] = useState<Array<{ title: string; uri: string }>>([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number }>({
    latitude: 42.9849, // London, Ontario
    longitude: -81.2453
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearchGrounding = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Search grounding failed');
      }

      setSearchResult(data.result);
      setSearchSources(data.sources || []);

      // Save to Firestore if connected
      try {
        if (db) {
          await addDoc(collection(db, 'user_ai_logs'), {
            type: 'search_grounding',
            model: 'gemini-3.8-flash',
            query: searchQuery,
            sourceCount: data.sources?.length || 0,
            createdAt: serverTimestamp()
          });
        }
      } catch (dbErr) {
        console.warn('Firestore log save skipped:', dbErr);
      }
    } catch (err: any) {
      console.error('Search Grounding error:', err);
      setErrorMsg(err.message || 'Error querying Google Search grounding.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMapsGrounding = async () => {
    if (!mapsQuery.trim()) return;
    setMapsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mapsQuery,
          latitude: selectedCoordinates.latitude,
          longitude: selectedCoordinates.longitude
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Maps grounding failed');
      }

      setMapsResult(data.result);
      setMapsPlaces(data.places || []);

      // Save to Firestore if connected
      try {
        if (db) {
          await addDoc(collection(db, 'user_ai_logs'), {
            type: 'maps_grounding',
            model: 'gemini-3.8-flash',
            query: mapsQuery,
            placeCount: data.places?.length || 0,
            createdAt: serverTimestamp()
          });
        }
      } catch (dbErr) {
        console.warn('Firestore log save skipped:', dbErr);
      }
    } catch (err: any) {
      console.error('Maps Grounding error:', err);
      setErrorMsg(err.message || 'Error querying Google Maps grounding.');
    } finally {
      setMapsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black shadow-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Google Grounded Live Intelligence
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                gemini-3.8-flash (Search &amp; Maps Tools)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live web fact-checking and geographic place retrieval grounded directly by Google Search and Google Maps.
            </p>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('search')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'search'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Google Search Grounding
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('maps')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'maps'
                ? 'bg-emerald-600 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Google Maps Grounding
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode 1: Search Grounding */}
      {activeSubTab === 'search' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask for up-to-date web facts, weather, border delays, or fuel prices..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              disabled={searchLoading}
              onClick={handleSearchGrounding}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow disabled:opacity-50"
            >
              {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Query Live Search
            </button>
          </div>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              'Current commercial truck border wait times at Ambassador Bridge',
              'Ontario Highway 401 weather advisories near London',
              'Average wholesale diesel price per liter in Ontario today',
              'US CBP commercial vehicle lane status Blue Water Bridge'
            ].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSearchQuery(q)}
                className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Result view */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-5 min-h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Search-Grounded Synthesis
                </span>
                <span className="font-mono text-[11px] text-slate-500">Tool: googleSearch</span>
              </div>

              <div className="py-4">
                {searchLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    <p className="text-xs text-blue-300 font-mono">Querying real-time Google Search data...</p>
                  </div>
                ) : searchResult ? (
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {searchResult}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12 space-y-2 text-xs">
                    <Search className="w-10 h-10 mx-auto text-slate-700" />
                    <p>Enter a query above to retrieve live Google Search-grounded facts.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sources column */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block pb-3 border-b border-slate-800">
                Grounded Web Sources ({searchSources.length})
              </span>

              <div className="py-3 space-y-2.5 max-h-[360px] overflow-y-auto">
                {searchSources.length > 0 ? (
                  searchSources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs block transition-colors group"
                    >
                      <div className="flex items-center justify-between font-medium text-blue-400 group-hover:text-blue-300">
                        <span className="truncate">{src.title || 'Web Reference'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 ml-1.5" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono truncate block mt-1">
                        {src.uri}
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Sources will appear here once you run a search grounding query.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Maps Grounding */}
      {activeSubTab === 'maps' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                placeholder="Search places: truck stops, CAT weigh scales, rest areas, heavy truck repair..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              disabled={mapsLoading}
              onClick={handleMapsGrounding}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow disabled:opacity-50"
            >
              {mapsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              Query Google Maps
            </button>
          </div>

          {/* Quick Location Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Corridor Center:</span>
            {[
              { name: 'London, ON (MM 186)', lat: 42.9849, lng: -81.2453 },
              { name: 'Windsor Crossing', lat: 42.3149, lng: -83.0364 },
              { name: 'Cambridge / Kitchener', lat: 43.3616, lng: -80.3144 },
              { name: 'Sarnia / Port Huron', lat: 42.9745, lng: -82.4066 }
            ].map((loc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedCoordinates({ latitude: loc.lat, longitude: loc.lng })}
                className={`px-2.5 py-1 rounded border text-[11px] font-mono transition-colors ${
                  selectedCoordinates.latitude === loc.lat
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* Result view */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-5 min-h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  Maps Grounded Analysis &amp; Amenities
                </span>
                <span className="font-mono text-[11px] text-slate-500">Tool: googleMaps</span>
              </div>

              <div className="py-4">
                {mapsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs text-emerald-300 font-mono">Querying real-time Google Maps place data...</p>
                  </div>
                ) : mapsResult ? (
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {mapsResult}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12 space-y-2 text-xs">
                    <MapPin className="w-10 h-10 mx-auto text-slate-700" />
                    <p>Enter a query to find real commercial freight places grounded via Google Maps.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Places column with Google Maps URLs */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block pb-3 border-b border-slate-800">
                Grounded Google Maps Places ({mapsPlaces.length})
              </span>

              <div className="py-3 space-y-2.5 max-h-[360px] overflow-y-auto">
                {mapsPlaces.length > 0 ? (
                  mapsPlaces.map((place, idx) => (
                    <a
                      key={idx}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs block transition-colors group"
                    >
                      <div className="flex items-center justify-between font-bold text-emerald-400 group-hover:text-emerald-300">
                        <span className="truncate flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          {place.title || 'Google Maps Location'}
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0 ml-1.5" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono truncate block mt-1">
                        Open in Google Maps &rarr;
                      </span>
                    </a>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 py-6 text-center space-y-1">
                    <p>Grounded place links will be listed here.</p>
                    <p className="text-[11px] text-slate-600">Always includes direct Google Maps place URLs as required.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
