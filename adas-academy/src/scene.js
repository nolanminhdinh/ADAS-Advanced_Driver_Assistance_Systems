/** An original, responsive SVG illustration for the ADAS learning dashboard. */
export function roadScene({ compact = false } = {}) {
  const id = compact ? 'adas-road-small' : 'adas-road-hero';
  return `
    <svg class="road-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 340" fill="none" role="img" aria-labelledby="${id}-title">
      <title id="${id}-title">An intelligent vehicle combines its sensors to understand the surrounding road.</title>
      <defs>
        <linearGradient id="${id}-road" x1="172" y1="96" x2="382" y2="294" gradientUnits="userSpaceOnUse">
          <stop stop-color="#273744"/><stop offset="1" stop-color="#172631"/>
        </linearGradient>
        <linearGradient id="${id}-body" x1="259" y1="128" x2="354" y2="238" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F1F5F7"/><stop offset=".46" stop-color="#B9CDD7"/><stop offset="1" stop-color="#6D899A"/>
        </linearGradient>
        <linearGradient id="${id}-side" x1="269" y1="227" x2="403" y2="170" gradientUnits="userSpaceOnUse">
          <stop stop-color="#5C788A"/><stop offset=".45" stop-color="#A6BCC7"/><stop offset="1" stop-color="#3B596B"/>
        </linearGradient>
        <linearGradient id="${id}-glass" x1="248" y1="154" x2="339" y2="203" gradientUnits="userSpaceOnUse">
          <stop stop-color="#537D92"/><stop offset=".45" stop-color="#203E51"/><stop offset="1" stop-color="#0C2435"/>
        </linearGradient>
        <linearGradient id="${id}-scan" x1="364" y1="158" x2="541" y2="95" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F57D40" stop-opacity=".31"/><stop offset="1" stop-color="#F57D40" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="${id}-ambient">
          <stop stop-color="#F98143" stop-opacity=".14"/><stop offset="1" stop-color="#F98143" stop-opacity="0"/>
        </radialGradient>
        <filter id="${id}-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
        <filter id="${id}-shadow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <clipPath id="${id}-road-clip"><path d="M52 207 348 30 578 145 282 322Z"/></clipPath>
      </defs>

      <ellipse cx="332" cy="190" rx="254" ry="146" fill="url(#${id}-ambient)"/>
      <g stroke="#527080" stroke-opacity=".23" stroke-width="1">
        <path d="M43 118h8m-4-4v8M523 39h8m-4-4v8M582 255h8m-4-4v8M110 303h8m-4-4v8M165 45h8m-4-4v8"/>
        <path d="m85 157 352-210M31 269l342-204M244 338 353-211" stroke-dasharray="2 7"/>
      </g>

      <!-- A shallow road slab, with a restrained isometric perspective. -->
      <path d="M52 207v9l230 115 296-177v-9L282 322Z" fill="#0B1720"/>
      <path d="m52 207 296-177 230 115-296 177Z" fill="url(#${id}-road)" stroke="#425460" stroke-width="1"/>
      <path d="m64 213 296-177M270 316l296-177" stroke="#63727A" stroke-opacity=".6" stroke-width="1.4"/>
      <path d="m167 264 296-177" stroke="#BCCBD0" stroke-opacity=".65" stroke-width="2" stroke-dasharray="15 17"/>
      <path d="m87 223 296-177m-137 257 296-177" stroke="#88ABBC" stroke-opacity=".22" stroke-width="1" stroke-dasharray="2 8"/>

      <g clip-path="url(#${id}-road-clip)">
        <path d="m345 175 153-133 75 77Z" fill="url(#${id}-scan)"/>
        <path d="m345 175 153-133m-153 133 228-56" stroke="#F3864B" stroke-opacity=".42" stroke-width="1"/>
        <g stroke="#F58B50" stroke-width="1.2">
          <path d="M384 127q26 6 38 30" stroke-opacity=".8"/>
          <path d="M415 104q40 9 58 44" stroke-opacity=".52"/>
          <path d="M451 78q53 12 78 58" stroke-opacity=".3"/>
          <path d="M485 53q68 14 101 72" stroke-opacity=".15"/>
        </g>
        <path d="m247 266 247-149" stroke="#58C8CD" stroke-opacity=".3" stroke-width="1.4" stroke-dasharray="4 7"/>
        <path d="m182 229 244-146" stroke="#58C8CD" stroke-opacity=".23" stroke-width="1.4" stroke-dasharray="4 7"/>
      </g>

      <!-- A detected vehicle farther along the road. -->
      <g>
        <path d="m428 113 46-28 31 15-46 29Z" fill="#081720" opacity=".6"/>
        <path d="m430 103 43-26 30 15v10l-43 26-30-15Z" fill="#2C4C5F"/>
        <path d="m430 103 43-26 30 15-43 26Z" fill="#69818C"/>
        <path d="m442 96 22-14 23 12-22 14Z" fill="#152E40"/>
        <path d="m451 91 12-7 19 10-12 7Z" fill="#4C6D7F"/>
        <path d="m461 118 39-24m-67 12 24 12" stroke="#93ADBA" stroke-width="1.2"/>
        <path d="m419 105 54-33 39 19v25l-54 33-39-19Z" stroke="#58C7D0" stroke-opacity=".72" stroke-width="1.1"/>
        <path d="m419 105 39 19 54-33m-54 33v25" stroke="#58C7D0" stroke-opacity=".35" stroke-width=".8"/>
        <path d="m419 113v-8l8-5m77-14 8 5v8m-54 42v8l-8-4" stroke="#83ECED" stroke-width="1.8"/>
      </g>

      <!-- Contact shadow and visible wheels under the primary vehicle. -->
      <path d="m205 224 141-84 68 34-141 84Z" fill="#020E16" opacity=".78" filter="url(#${id}-shadow)"/>
      <g fill="#08151E" stroke="#425865" stroke-width="2">
        <ellipse cx="233" cy="213" rx="10" ry="14" transform="rotate(28 233 213)"/>
        <ellipse cx="329" cy="156" rx="10" ry="14" transform="rotate(28 329 156)"/>
        <ellipse cx="282" cy="239" rx="11" ry="16" transform="rotate(28 282 239)"/>
        <ellipse cx="377" cy="182" rx="11" ry="16" transform="rotate(28 377 182)"/>
      </g>
      <g fill="#728E9D" stroke="#1B3445" stroke-width="2.6">
        <ellipse cx="284" cy="240" rx="5" ry="9" transform="rotate(28 284 240)"/>
        <ellipse cx="379" cy="183" rx="5" ry="9" transform="rotate(28 379 183)"/>
      </g>

      <!-- Silver body, sculpted cabin, glazing, and small automotive details. -->
      <path d="m202 208 59 34 144-83v14q0 5-6 9l-128 77q-8 4-15-1l-48-27q-6-4-6-10Z" fill="url(#${id}-side)"/>
      <path d="M202 208q-2-8 8-14l126-75q8-5 16-1l46 24q9 5 7 17l-136 82q-8 5-15 0Z" fill="url(#${id}-body)" stroke="#BCD0DB" stroke-width=".9"/>
      <path d="m211 204 20-12 33 19-15 20Z" fill="#7896A7"/>
      <path d="m222 198 24-31 52-30 42 24 26 4-102 62Z" fill="url(#${id}-glass)" stroke="#CADBE2" stroke-width="1.3"/>
      <path d="m246 167 52-30 42 24-52 30Z" fill="#C3D4DD" stroke="#E2EBEF" stroke-width="1"/>
      <path d="m251 168 47-27 36 20-47 27Z" fill="#A4BDC9"/>
      <path d="m298 137 26 4 42 24-26-4Z" fill="#53768B"/>
      <path d="m324 141 18-13 51 25-27 12Z" fill="#CDDBE1"/>
      <path d="m231 195 17-23 35 20-19 29Z" fill="#234658"/>
      <path d="m290 195 13-8 4 24-20 12Z" fill="#173646"/>
      <path d="m307 185 26-16 19 4-42 25Z" fill="#254C60"/>
      <path d="m270 237 94-56m-62 39 2 13m49-43 2 13" stroke="#3D5C6E" stroke-opacity=".75" stroke-width="1"/>
      <path d="m309 218 9-5m30-19 9-5" stroke="#D6E4EA" stroke-width="1.8" stroke-linecap="round"/>
      <path d="m216 219 23 13" stroke="#FE8152" stroke-width="3" stroke-linecap="round"/>
      <path d="m385 166 13-8" stroke="#E5F9FF" stroke-width="3" stroke-linecap="round"/>
      <path d="m263 246 12-7m112-67 14-8" stroke="#DFEDF1" stroke-width="1.2" stroke-linecap="round"/>
      <path d="m322 170 10-1 4 5-8 4Z" fill="#516F82" stroke="#B2C8D3" stroke-width=".7"/>
      <path d="m228 181 9 4-3 5-10-5Z" fill="#7290A2" stroke="#BCD0DB" stroke-width=".7"/>

      <!-- A fusion sensor pulses above the roof. -->
      <ellipse cx="294" cy="162" rx="26" ry="13" fill="#F78A4A" fill-opacity=".13" stroke="#F99458" stroke-opacity=".5" stroke-width=".8"/>
      <ellipse cx="294" cy="162" rx="16" ry="8" stroke="#FFAE72" stroke-opacity=".8" stroke-width=".8"/>
      <ellipse cx="294" cy="160" rx="7" ry="3.5" fill="#FFAD70" filter="url(#${id}-glow)"/>
      <path d="M288 160v-4c0-4 12-4 12 0v4c0 4-12 4-12 0Z" fill="#223F50"/>
      <ellipse cx="294" cy="156" rx="6" ry="3" fill="#F69A5E" stroke="#FFC79E" stroke-width=".7"/>

      <path d="m189 213-9 5v18l77 39 164-99v-18l-9-4" stroke="#E89759" stroke-opacity=".48" stroke-width=".9" stroke-dasharray="4 5"/>
      <path d="m180 223v-5l8-5m69 54v8l8-5m148-99 8-5v-8" stroke="#F8A269" stroke-width="1.6"/>

      ${compact ? '' : `
      <g font-family="'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace">
        <path d="M91 81h68l80 54" stroke="#69818D" stroke-opacity=".6" stroke-width=".8"/>
        <circle cx="239" cy="135" r="2.6" fill="#F9955A"/>
        <text x="71" y="65" fill="#AABDC7" font-size="8.5" letter-spacing="1.4">SENSOR FUSION</text>
        <text x="71" y="79" fill="#607F90" font-size="7.5" letter-spacing=".35">CAMERA · RADAR · LiDAR</text>
        <path d="M483 167v37h-51" stroke="#69818D" stroke-opacity=".6" stroke-width=".8"/>
        <circle cx="483" cy="167" r="2.4" fill="#67D5DB"/>
        <text x="432" y="219" fill="#AABDC7" font-size="8.5" letter-spacing="1.4">PERCEPTION</text>
        <text x="432" y="233" fill="#607F90" font-size="7.5" letter-spacing=".35">OBJECT DETECTED · 24.8 m</text>
        <rect x="387" y="270" width="181" height="44" rx="7" fill="#142935" fill-opacity=".94" stroke="#39505C" stroke-width=".8"/>
        <circle cx="403" cy="285" r="2.8" fill="#80D5B2"/>
        <text x="414" y="288" fill="#BCD4D8" font-size="7.5" letter-spacing="1.2">SYSTEM ONLINE</text>
        <text x="402" y="303" fill="#7897A8" font-size="7.5" letter-spacing=".5">360° AWARENESS</text>
        <path d="M541 293v-7m4 7v-11m4 11v-16m4 16v-21" stroke="#F2965C" stroke-width="2" stroke-linecap="round"/>
      </g>`}
    </svg>`;
}
