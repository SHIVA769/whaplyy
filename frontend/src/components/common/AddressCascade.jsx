import React, { useState, useEffect } from 'react';

const DEFAULT_LOCATIONS = {
  'United States': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
    'New York': ['New York City', 'Buffalo', 'Albany', 'Rochester'],
    'Texas': ['Austin', 'Houston', 'Dallas', 'San Antonio'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
  },
  'United Kingdom': {
    'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Bristol'],
    'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen'],
    'Wales': ['Cardiff', 'Swansea'],
  },
  'United Arab Emirates': {
    'Dubai': ['Dubai City', 'Deira', 'Jumeirah', 'Downtown'],
    'Abu Dhabi': ['Abu Dhabi Island', 'Al Ain'],
    'Sharjah': ['Sharjah City'],
  },
  'Canada': {
    'Ontario': ['Toronto', 'Ottawa', 'Mississauga'],
    'British Columbia': ['Vancouver', 'Victoria', 'Burnaby'],
    'Quebec': ['Montreal', 'Quebec City'],
  },
  'India': {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
    'Karnataka': ['Bangalore', 'Mysore'],
    'Delhi': ['New Delhi', 'South Delhi'],
    'Tamil Nadu': ['Chennai', 'Coimbatore'],
  },
};

export const AddressCascade = ({
  values = { street: '', country: 'United States', state: 'California', city: 'Los Angeles', postalCode: '' },
  onChange,
  disabled = false,
}) => {
  const countries = Object.keys(DEFAULT_LOCATIONS);
  const states = values.country && DEFAULT_LOCATIONS[values.country] ? Object.keys(DEFAULT_LOCATIONS[values.country]) : [];
  const cities = values.country && values.state && DEFAULT_LOCATIONS[values.country]?.[values.state] ? DEFAULT_LOCATIONS[values.country][values.state] : [];

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    const newStates = DEFAULT_LOCATIONS[newCountry] ? Object.keys(DEFAULT_LOCATIONS[newCountry]) : [];
    const firstState = newStates[0] || '';
    const newCities = firstState ? DEFAULT_LOCATIONS[newCountry]?.[firstState] || [] : [];
    const firstCity = newCities[0] || '';

    onChange({
      ...values,
      country: newCountry,
      state: firstState,
      city: firstCity,
    });
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    const newCities = values.country && DEFAULT_LOCATIONS[values.country]?.[newState] ? DEFAULT_LOCATIONS[values.country][newState] : [];
    const firstCity = newCities[0] || '';

    onChange({
      ...values,
      state: newState,
      city: firstCity,
    });
  };

  const handleCityChange = (e) => {
    onChange({
      ...values,
      city: e.target.value,
    });
  };

  return (
    <div className="space-y-3 text-left">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Street Address / Unit
        </label>
        <input
          type="text"
          placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
          value={values.street || ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, street: e.target.value })}
          className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Country */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Country
          </label>
          <select
            value={values.country || countries[0]}
            disabled={disabled}
            onChange={handleCountryChange}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            State / Region
          </label>
          <select
            value={values.state || states[0] || ''}
            disabled={disabled}
            onChange={handleStateChange}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            City
          </label>
          <select
            value={values.city || cities[0] || ''}
            disabled={disabled}
            onChange={handleCityChange}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Postal / Zip Code
        </label>
        <input
          type="text"
          placeholder="e.g. 94105"
          value={values.postalCode || ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, postalCode: e.target.value })}
          className="w-full sm:w-1/3 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
        />
      </div>
    </div>
  );
};
