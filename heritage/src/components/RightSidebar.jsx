
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Star, Eye, Clock, MapPin } from 'lucide-react';
import Papa from 'papaparse';

const RightSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [heritageData, setHeritageData] = useState([]);

const loadCSVData = async () => {
  try {
    const response = await fetch('/Tamil_Nadu_Heritage_Sites_200plus.csv');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const csvData = await response.text();

    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        const processedData = results.data
          .filter(row => row.name && row.town && row.district && row.genre)
          .map((row, index) => ({
            id: index + 1,
            name: row.name?.trim() || '',
            town: row.town?.trim() || '',
            district: row.district?.trim() || '',
            genre: row.genre?.trim() || ''
          }))
          .filter(site => 
            !site.name.includes('Extension') || 
            (site.name.includes('Extension') && site.district === site.town)
          )
          .slice(0, 50);

        setHeritageData(processedData);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setError('Failed to parse heritage sites data');
      }
    });
  } catch (err) {
    console.error('Error loading CSV:', err);
    setError('Failed to load heritage sites data');
  }
};

  const generateRecommendations = () => {
    if (heritageData.length === 0) {
      setError('No heritage data available');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      try {
        const shuffled = [...heritageData].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 12);
        
        const formattedRecommendations = selected.map(site => ({
          id: site.id,
          title: site.name,
          description: `Explore the magnificent ${site.name} in ${site.town}, ${site.district}. This ${site.genre.toLowerCase()} represents the rich cultural heritage of Tamil Nadu.`,
          location: `${site.town}, ${site.district}`,
          genre: site.genre,
          rating: (4.2 + Math.random() * 0.7).toFixed(1), // Random rating between 4.2-4.9
          views: `${(Math.random() * 20 + 5).toFixed(1)}k`, // Random views
          type: site.genre
        }));
        
        setRecommendations(formattedRecommendations);
      } catch (err) {
        setError('Failed to load heritage recommendations');
        console.error('Error generating recommendations:', err);
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  useEffect(() => {
    loadCSVData();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const windowWidth = window.innerWidth;
      const threshold = 50;
      
      if (windowWidth - e.clientX <= threshold) {
        if (!isOpen) {
          setIsOpen(true);
          if (recommendations.length === 0 && heritageData.length > 0) {
            generateRecommendations();
          }
        }
      }
    };

    const handleMouseLeave = (e) => {
      if (e.clientX >= window.innerWidth - 1 || e.clientX <= 0) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isOpen, recommendations.length, heritageData.length]);

  // Get genre color
  const getGenreColor = (genre) => {
    const colors = {
      'Temple': '#FFD700', // Gold
      'Palace': '#9370DB', // Purple
      'Fort': '#CD853F', // Saddle Brown
      'Church': '#4169E1', // Royal Blue
      'Wildlife': '#228B22', // Forest Green
      'Nature': '#32CD32', // Lime Green
      'Museum': '#FF6347', // Tomato
      'Beach': '#1E90FF', // Dodger Blue
      'Hill Station': '#8FBC8F', // Dark Sea Green
      'Lake': '#00CED1', // Dark Turquoise
      'Heritage': '#DAA520', // Goldenrod
      'Bridge': '#708090', // Slate Gray
      'Memorial': '#B22222', // Fire Brick
      'Statue': '#4682B4', // Steel Blue
      'Waterfalls': '#00BFFF' // Deep Sky Blue
    };
    
    return colors[genre] || '#888888';
  };

  // Heritage recommendation item component
  const HeritageRecommendationItem = ({ item, index }) => (
    <div 
      className="p-4 border-b hover:bg-opacity-50 transition-all cursor-pointer rounded-lg mb-2"
      style={{ 
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <div className="flex items-start space-x-3">
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: getGenreColor(item.genre) + '40' }}
        >
          <span className="font-semibold text-xs" style={{ color: getGenreColor(item.genre) }}>
            {item.genre?.charAt(0)?.toUpperCase() || 'H'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {item.title}
          </h3>
          <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {item.description}
          </p>
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
              <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{item.location}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div 
              className="px-2 py-1 rounded-full text-xs"
              style={{ 
                backgroundColor: getGenreColor(item.genre) + '20',
                color: getGenreColor(item.genre)
              }}
            >
              {item.type}
            </div>
            {item.rating && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{item.rating}</span>
              </div>
            )}
            {item.views && (
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{item.views}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Invisible trigger zone */}
      <div 
        className="fixed top-0 right-0 w-12 h-full z-40 pointer-events-none"
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          width: '320px',
          backgroundColor: '#dddddd62',
          color: 'rgba(255, 255, 255, 0.352)',
          boxShadow: '2px 0 8px rgba(255, 255, 255, 0.177)'
        }}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Header */}
        <div 
          className="sticky top-4 flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 z-10 rounded-2xl mx-1 mb-2"
          style={{ 
            backgroundColor: '#dddddd62',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Heritage Sites
            </h2>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Discover Tamil Nadu's treasures
            </p>
          </div>
        </div>

        {/* Content */}
        <div 
          id="recommendations-container"
          className="flex-1 overflow-y-auto px-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            minHeight: 0,
          }}
        >
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'rgba(255, 255, 255, 0.5)' }}></div>
              <p className="mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading heritage sites...</p>
            </div>
          )}

          {error && (
            <div className="p-4 m-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.2)' }}>
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Error: {error}</p>
              <button 
                onClick={generateRecommendations}
                className="mt-2 text-sm underline hover:opacity-70"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && recommendations.length === 0 && (
            <div className="p-8 text-center">
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No heritage sites available</p>
            </div>
          )}

          {!loading && !error && recommendations.length > 0 && (
            <div>
              {recommendations.map((item, index) => (
                <HeritageRecommendationItem key={item.id} item={item} index={index} />
              ))}
              <div className="h-4"></div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t flex-shrink-0 rounded-2xl mx-1 mt-2"
          style={{ 
            backgroundColor: '#dddddd62',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Showing {recommendations.length} heritage sites
          </div>
          <button 
            onClick={generateRecommendations}
            className="w-full py-2 px-4 rounded-lg transition-all text-sm hover:opacity-80"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Discover More Sites'}
          </button>
        </div>
      </div>

      {/* CSS to hide scrollbar */}
      <style jsx>{`
        #recommendations-container::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        #recommendations-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default RightSidebar;