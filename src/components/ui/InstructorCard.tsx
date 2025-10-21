"use client";

import Image from "next/image";
import Link from "next/link";

interface InstructorCardProps {
  id: string;
  name: string;
  avatarUrl?: string;
  hourlyRate: number;
  location: string;
  vehicleType: string;
  distance?: number;
  description?: string;
  rating?: number;
  onBookLesson?: () => void;
  className?: string;
}

export default function InstructorCard({
  id,
  name,
  avatarUrl,
  hourlyRate,
  location,
  vehicleType,
  distance,
  description,
  rating = 4.8,
  className = ""
}: InstructorCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className={`card ${className}`}>
      <div className="flex items-start gap-4">
        {/* Profile Photo */}
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={64}
              height={64}
              className="rounded-[var(--radius-md)] object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-[var(--primary-green)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-[var(--text-black)] mb-1">
                {name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2">
                <span className="bg-black text-white px-2 py-0.5 rounded-full text-sm font-semibold flex items-center justify-center">
                  <span className="leading-none">{rating}</span><span className="relative inline-block text-xl bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer leading-none">★</span>
                </span>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center mr-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <span className="font-medium">{location}</span>
                </div>
                {distance && <span>• {distance.toFixed(1)} km away</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--primary-green)]">
                £{hourlyRate}
              </div>
              <div className="text-sm text-[var(--text-muted)]">per hour</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-[var(--border-light)] text-[var(--text-black)] rounded-full text-sm font-medium">
              {vehicleType === "both" ? "Auto & Manual" : vehicleType}
            </span>
          </div>

          {description && (
            <p className="body-text text-sm mb-4 line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex gap-3">
            <Link
              href={`/booking/request?instructor_id=${id}`}
              className="btn-primary flex-1 text-center"
            >
              Book Lesson
            </Link>
            <Link
              href={`/instructor/profile?id=${id}`}
              className="btn-secondary flex-1 text-center"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
