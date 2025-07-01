"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { User } from "@/model/user";

// Define AvatarOptions type
interface AvatarOptions {
  avatarStyle?: string;
  topType?: string;
  accessoriesType?: string;
  hairColor?: string;
  facialHairType?:string;
  facialHairColor?: string;
  clotheType?: string;
  colorFabric?:string;
  eyeType?: string;
  eyebrowType?: string;
  mouthType?: string;
  skinColor?: string;
}

interface AvatarCustomizerProps {
  onSave: (avatarData: AvatarOptions) => Promise<void>;
  onClose: () => void;
  initialOptions: AvatarOptions;
}

const options = {
  avatarStyle: ["Circle", "Transparent"],
 topType: [
  "NoHair",
  "Eyepatch",
  "Hat",
  "Hijab",
  "Turban",
  "WinterHat1",
  "WinterHat2",
  "WinterHat3",
  "WinterHat4",
  "LongHairBigHair",
  "LongHairBob",
  "LongHairBun",
  "LongHairCurly",
  "LongHairCurvy",
  "LongHairDreads",
  "LongHairFrida",
  "LongHairFro",
  "LongHairFroBand",
  "LongHairNotTooLong",
  "LongHairShavedSides",
  "LongHairStraight",
  "LongHairStraight2",
  "LongHairStraightStrand",
  "ShortHairDreads01",
  "ShortHairDreads02",
  "ShortHairFrizzle",
  "ShortHairShaggyMullet",
  "ShortHairShortCurly",
  "ShortHairShortFlat",
  "ShortHairShortRound",
  "ShortHairShortWaved",
  "ShortHairSides",
  "ShortHairTheCaesar"
],

  accessoriesType: [
    "Blank",
    "Kurt",
    "Wayfarers",
    "Round",
    "Prescription01",
    "Sunglasses",
  ],
  hairColor: ["Blue", "Black", "Red", "White", "Pink","BrownDark","Blonde","SilverGray"],
  facialHairType: ["BeardLight", "BeardMedium", "BeardMajestic", "Blank","MoustacheFancy", "MoustacheMagnum"],

  facialHairColor:["Auburn","Black","Blonde","BlondeGolden","Brown","BrownDark","Red","Platinum"],
  
  clotheType: [
    "BlazerShirt",
    "Hoodie",
    "ShirtCrewNeck",
    "ShirtScoopNeck",
    "GraphicShirt",
    "CollarSweater"
  ],
  colorFabric: [
  "Black",
  "Blue01",
  "Blue02",
  "Blue03",
  "Gray01",
  "Gray02",
  "Heather",
  "PastelBlue",
  "PastelGreen",
  "PastelOrange",
  "PastelRed",
  "PastelYellow",
  "Pink",
  "Red",
  "White"
],

eyeType: [
  "Close",
  "Cry",
  "Default",
  "Dizzy",
  "EyeRoll",
  "Happy",
  "Hearts",
  "Side",
  "Squint",
  "Surprised",
  "Wink",
  "WinkWacky"
],

 eyebrowType: [
  "Angry",
  "AngryNatural",
  "Default",
  "DefaultNatural",
  "FlatNatural",
  "RaisedExcited",
  "RaisedExcitedNatural",
  "SadConcerned",
  "SadConcernedNatural",
  "UnibrowNatural",
  "UpDown",
  "UpDownNatural"
],

 mouthType: [
  "Concerned",
  "Default",
  "Disbelief",
  "Eating",
  "Grimace",
  "Sad",
  "ScreamOpen",
  "Serious",
  "Smile",
  "Tongue",
  "Twinkle",
  "Vomit"
],

  skinColor: ["Light", "Brown", "DarkBrown", "Pale", "Yellow","Black","Tanned"],
};




export function AvatarCustomizer({
  onSave,
  onClose,
  initialOptions,
}: AvatarCustomizerProps) {
  const [avatarOptions, setAvatarOptions] =
    useState<AvatarOptions>(initialOptions);

  const handleOptionChange = (key: keyof AvatarOptions, value: string) => {
    setAvatarOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await onSave(avatarOptions);
  };

  const generateAvatarUrl = () => {
    const params = new URLSearchParams();
    Object.entries(avatarOptions).forEach(([key, value]) => {
      if (value) params.set(key, value as string);
    });
    return `https://avataaars.io/?${params.toString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <h2 className="text-xl font-bold">Customize Your Avatar</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-all p-1 hover:bg-white/20 rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[70vh]">
          {/* Avatar Preview Section */}
          <div className="flex-shrink-0 bg-gradient-to-br from-gray-50 to-blue-50 p-6 flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
                <img
                  src={generateAvatarUrl()}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://ui-avatars.com/api/?name=Avatar&background=6366f1&color=fff&size=256";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Options Section - Scrollable */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {Object.entries(options).map(([key, values]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-gray-700 font-medium capitalize text-sm">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                  <Select
                    value={avatarOptions[key as keyof AvatarOptions] || ""}
                    onValueChange={(value) =>
                      handleOptionChange(key as keyof AvatarOptions, value)
                    }
                  >
                    <SelectTrigger className="bg-white border border-gray-200 hover:border-blue-300 text-gray-800 h-10">
                      <SelectValue
                        placeholder={`Select ${key
                          .replace(/([A-Z])/g, " $1")
                          .trim()
                          .toLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                      {values.map((value) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="hover:bg-blue-50 cursor-pointer py-2"
                        >
                          <span className="capitalize">
                            {value.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow hover:shadow-md transition-all"
              >
                Save Avatar
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const randomOptions: AvatarOptions = {};
                  Object.entries(options).forEach(([key, values]) => {
                    randomOptions[key as keyof AvatarOptions] =
                      values[Math.floor(Math.random() * values.length)];
                  });
                  setAvatarOptions(randomOptions);
                }}
                className="border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Randomize
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
