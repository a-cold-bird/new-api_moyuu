/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from "react";

export function LogoTile({
  name,
  src,
  icon: Icon,
  badge,
  size = 54,
  tone = "neutral",
  wide = false,
  invertLight = false,
  invertDark = false,
}) {
  return (
    <div className={`home-logo-tile home-logo-tone-${tone} flex w-full flex-col items-center justify-center text-center`} title={name}>
      {Icon ? (
        <div className={`home-logo-icon-wrapper flex items-center justify-center ${`${invertLight ? 'is-invertible' : ''} ${invertDark ? 'is-invert-dark' : ''}`} ${invertDark ? 'is-invert-dark' : ''}`}>
          {Icon.Color ? (
            <Icon.Color size={size} />
          ) : (
            <Icon size={size} />
          )}
        </div>
      ) : src ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className={`home-logo-image ${wide ? "home-logo-image-wide" : ""} ${invertLight ? "is-invertible" : ""} ${invertDark ? "is-invert-dark" : ""}`.trim()}
          loading="lazy"
        />
      ) : (
        <span className="home-logo-badge">{badge}</span>
      )}
      <div className="text-[11px] leading-none text-muted">{name}</div>
    </div>
  );
}
