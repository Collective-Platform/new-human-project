"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Category = "Mental" | "Emotional" | "Physical";
type ActivationType =
  | "Hyrox"
  | "Spin"
  | "Pilates"
  | "Breathwork"
  | "Mental Framing"
  | "Emotional Cadence";

const CATEGORY_STYLES: Record<Category, { bg: string; text: string }> = {
  Mental: { bg: "bg-category-mental-bg", text: "text-category-mental" },
  Emotional: {
    bg: "bg-category-emotional-bg",
    text: "text-category-emotional",
  },
  Physical: { bg: "bg-category-physical-bg", text: "text-category-physical" },
};

const SPEAKERS: {
  name: string;
  title: string;
  bio: string;
  bioZh?: string;
  image: string;
  category: Category;
  language?: string;
  activation?: ActivationType;
}[] = [
  {
    name: "Kevin Loo",
    title: "Founder, Collective",
    bio: "Kevin Loo is a creative, a dreamer and a communicator. \n\nHis fierce and relentless tenacity to break limiting mindsets have led him to help thousands uncover and unleash their fullest potential in life. \n\nIn 2001, he founded a contemporary church called Collective with only 15 people to begin with. Today, it is a thriving movement of 15 like-minded churches worldwide.",
    image: "/live/kevin-loo.jpg",
    category: "Mental",
  },
  {
    name: "Tim Tiah",
    title: "Co-founder, Colony & Nuffnang",
    bio: "Timothy Tiah is a Malaysian entrepreneur, investor, and content creator. He is the co-founder of Nuffnang and Colony, and has built an audience of nearly 200,000 Instagram followers, generating around 27 million monthly views through content focused on business, economics, entrepreneurship, and personal finance. His mission is to help Malaysians better understand the forces shaping their money, careers, and everyday lives.",
    image: "/live/timothy-tiah.jpg",
    category: "Emotional",
  },

  {
    name: "Dr Victor Lee",
    title: "President, Bible College of Malaysia",
    bio: "Rev Dr Victor Lee has been the President of Bible College of Malaysia since January 2017. He is also an EXCO member of the Assemblies of God of Malaysia and a Council member of the National Evangelical Christian Fellowship (NECF). He holds a PhD in Divinity from the University of Aberdeen, Scotland. His thesis was published by Langham Monograph (2021) with the title Reading Johannine Dramatic Irony through Ancient Dramatic Devices.",
    image: "/live/dr-victor-lee.jpg",
    category: "Mental",
  },
  {
    name: "Dr Andrew Lim\n (林岭啸博士)",
    title: "Academic Dean, Bible College of Malaysia",
    bio: "Rev. Dr. Andrew Lim grew up in a pastor family as his parents are AG ministers. He graduated with a music degree in 1999 and later received his Master of Church Music in 2002. Then he continued his study in Hong Kong Alliance Bible Seminary and graduated in 2012 with a Master of Theology. In 2024, he received a PhD from Alphacrucis University College in Sydney. From 2003-2009, he served as the Worship and Youth pastor under the leadership of Rev. Lawrence Yap, Charis Christian Centre. Since 2012, he has been a full-time lecturer at Bible College of Malaysia and is currently the academic dean. He published a bible study book Pentecostal Beliefs: Full Gospel. He is currently a member of the Executive Committee of the Assembly of God in Malaysia, leading Home Mission Dept and Church Planting Commission. He married with Dr. Helen Lew with two children, Isaac and Hazel Lim.",
    bioZh:
      "林岭啸牧师博士（Rev. Dr. Andrew Lim）出身自牧者家庭，父母皆为牧师。1999年，毕业自台湾师范大学音乐系，获音乐文学士，主修钢琴。后于2002年，毕业自新加坡神学院，获教会音乐硕士。2009年，赴香港建道神学院进修，并于2012年获得神学硕士，主修旧约（约伯记）。2024年，获得澳洲 Alphacrucis University College哲学博士，主修旧约（以西结书）。2003-2009年，任职于吉隆坡基督恩典中心，担任敬拜和青少年传道七年。2012年至今，任职马来西亚圣经学院（Bible College of Malaysia）全职讲师，并担任教务主任一职，并著有《五旬宗信仰之全备福音》查经书籍。现为马来西亚神召会执委会委员，并带领国内宣教部与植堂。与妻子刘海莲博士育有一男一女。",
    image: "/live/dr-andrew-lim.jpg",
    category: "Mental",
    language: "Chinese",
  },
  {
    name: "CJ Lee",
    title: "Co-founder, MOVE Private Fitness",
    bio: "CJ is the co-founder of MOVE Private Fitness, Southeast Asia's most established premium personal training brand, with 17 branches across Malaysia, Thailand and beyond. He is a recognized voice among fitness professionals across Asia having spoken at events such as Asia Fitness Conference, Beyond Activ, ExPro Fitness Conference, and IDEA Korea. His vision is to create a lasting ripple effect that empowers individuals, coaches and communities to live with purpose, resilience and hope.",
    image: "/live/cj-lee.jpg",
    category: "Physical",
  },
  {
    name: "Dan Blythe",
    title: "Global Youth Director, Alpha",
    bio: "Dan is the Global Youth Director for Alpha. His passion is helping people face fear so they can live life to the full. Dan has led creative teams and projects over the last two decades. He loves to write and recently launched his first book 'Facing Fear 365'. Dan lives in London UK and is married to Charlie. They have two boys Knox age 8 and Niko age 4 who Dan is raising to support Chelsea FC.",
    image: "/live/dan-blythe.jpg",
    category: "Mental",
    activation: "Mental Framing",
  },
  {
    name: "Wendy Vaz",
    title: "Coach, Breathwork Facilitator and Content Creator",
    bio: "Wendy Vaz is passionate about mindful, intentional living. Her journey through depression, PTSD, and burnout led her to discover the quiet power of breathwork and nervous system regulation — tools that transformed how she shows up in her creative work and her life. She believes calm is a practice, not a personality trait, and loves creating spaces where people can experience that for themselves.",
    image: "/live/wendy-vaz.jpg",
    category: "Emotional",
    activation: "Breathwork",
  },
  {
    name: "Lynnette Chai",
    title: "Co-founder, re:mind Psychology Center",
    bio: "As a mental health and human development professional, Lynnette brings a unique blend of expertise to her roles as a licensed counselor, professional coach, and HR consultant. She seamlessly weaves empathy and expertise into every facet of her work, committing to helping individuals and organizations thrive.\n\nWith over a decade of experience in corporate environments and coupled with her knowledge in human psychology, Lynnette's expertise, as a professional coach and HRD certified trainer, lies in translating theoretical concepts into practical, actionable strategies for workplace wellness. Her focus extends beyond productivity; it's about fostering environments that nurture both individual growth and organizational success, contributing to a culture of excellence.\n\nAs the co-founder and consultant therapist at the re:mind Psychology Center, Lynnette specializes in guiding individuals and couples through psychological, mental, and emotional challenges, facilitating authentic self-discovery, and promoting holistic well-being amidst life's complexities.\n\nIn all her roles, Lynnette wears many hats with a common thread—fostering growth, resilience, and well-being. She is driven by a genuine passion for helping others and a commitment to creating meaningful, lasting change. In her words: “It isn’t just about knowledge; it’s about the art of connecting with individuals and organizations on a profound emotional level, creating spaces for transformation and flourishing.”",
    image: "/live/lynnette-chai.jpg",
    category: "Emotional",
    activation: "Emotional Cadence",
  },
  {
    name: "Aziz Mohamed",
    title: "Head Coach, Train by Blackbox",
    bio: "Coach Aziz brings a multifaceted background in sports and athletics, encompassing basketball, track and field, weightlifting, and cycling. This diverse experience equips him with a comprehensive understanding of various disciplines within the realm of athletics, enabling him to effectively communicate with athletes across different events.\n\nHis journey led him to become a CrossFit Level 1 trainer and serve as a Senior/Performance Coach at CrossFit Pahlawan. With over a decade of dedication to fitness and lifestyle transformation, Coach Aziz has demonstrated a steadfast commitment to helping individuals achieve their personal goals.\n\nThrough his involvement in high-level sports, competitive CrossFit, and working with individuals of diverse backgrounds and goals, Coach Aziz has cultivated a deep hunger for continuous learning and a passion for guiding others toward success. His extensive experience and unwavering dedication make him a valuable asset to the TRAIN team, where he undoubtedly contributes to the growth and development of athletes under his guidance.",
    image: "/live/aziz-mohamed.jpg",
    category: "Physical",
    activation: "Hyrox",
  },
  {
    name: "Carine Ti",
    title: "Coach, Train by Blackbox",
    bio: "Just like everyone else, Coach Carine started off as a regular gym goer. New to CrossFit, she quickly fell in love with the community, comradery and the challenges. Driven by a deep passion to help others, she decided to leave her corporate life to become a coach.\n\n4 years into CrossFit and now NASM-Certified Personal Trainer certified, she believes that fitness isn't just about lifting heavier weights or getting through a tough workout, it's about moving better and improving quality of life.\n\nTransitioning from the corporate grind to coaching wasn't just a career change for her, it was a chance to follow her passion for fitness to help others achieve their full potential. Whether you're walking into the gym for the first time or chasing your next PR, she's here to challenge you, support you, and make sure you never leave a session without a win. You can join Coach Carine's Train Lite classes every Wednesdays and Fridays at CrossFit Train BlackBox.",
    image: "/live/carine-ti.jpg",
    category: "Physical",
    activation: "Hyrox",
  },
  {
    name: "Ada Ho",
    title: "Founder, Ho Cycle",
    bio: "Ada Ho, founder of Ho Cycle spent 7 years as a corporate lawyer before pursuing a new path that combined her passion for music, movement, and meaningful human connection.\n\nWith Ho Cycle, Ada's intention is to create a safe space where people feel welcomed, encouraged, and connected. Through indoor rhythm cycling, Ada has discovered that some of life's most meaningful moments happen when individuals come together as a community, sharing energy, joy, and support for one another.\n\nSince opening Ho Cycle 3 years ago, Ada has taught in Malaysia, Singapore and Los Angeles with the belief that movement can be a powerful way to build connections and inspire hope.\n\nHope to see you on the bikes! ☺️",
    image: "/live/ada-ho.jpg",
    category: "Physical",
    activation: "Spin",
  },
  {
    name: "Xing Han",
    title: "Reformer Pilates Instructor, Retune Physio & Pilates",
    bio: "Her pilates journey began when she was looking for ways to better manage her scoliosis. She experienced firsthand how much Pilates improved her strength, mobility, and overall well-being. This inspired her to become an instructor and help others move with greater ease, confidence, and body awareness.\n\nHer teaching style is gentle, supportive, and detail-oriented, focusing on helping clients build strength, improve mobility, and develop a deeper connection with their bodies in a safe and enjoyable way.",
    image: "/live/xing-han.jpg",
    category: "Physical",
    activation: "Pilates",
  },
  {
    name: "Boay Khim",
    title: "Chair Pilates Instructor, Retune Physio & Pilates",
    bio: "Boay Khim is a 56-year-old Pilates instructor. She intends to assist more middle-aged women in sustaining their body mobilisation and stability.\n\nShe aspires to empower and help clients of all ages and walks of life, educating them on the importance of sustaining core strength and balancing the entire body's muscles through Pilates.",
    image: "/live/boay-khim.jpg",
    category: "Physical",
    activation: "Pilates",
  },
];

export function SpeakersSection() {
  const [selected, setSelected] = useState<(typeof SPEAKERS)[0] | null>(null);
  const [lang, setLang] = useState<"en" | "zh">("en");

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const openSpeaker = (speaker: (typeof SPEAKERS)[0]) => {
    setSelected(speaker);
    setLang(speaker.bioZh ? "zh" : "en");
  };

  return (
    <section id="speakers" className="bg-black px-4 py-24 md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black leading-[1.1] text-white">
            Voices
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {SPEAKERS.map((speaker, i) => (
            <div
              key={i}
              className="group flex cursor-pointer flex-col"
              onClick={() => openSpeaker(speaker)}
            >
              <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-white/10">
                <Image
                  src={speaker.image}
                  alt={speaker.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/5" />
              </div>
              <div className="mb-0.5 flex flex-col md:flex-row md:items-center md:gap-2">
                <p className="text-lg font-black text-white transition-colors duration-200 group-hover:text-white/80 md:text-xl">
                  {speaker.name}
                </p>
                {(speaker.language || speaker.activation) && (
                  <div className="mt-1 flex flex-wrap gap-1 md:mt-0">
                    {speaker.language && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                        {speaker.language}
                      </span>
                    )}
                    {speaker.activation && (
                      <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-xs font-semibold text-red-400">
                        Activation
                      </span>
                    )}
                  </div>
                )}
              </div>
              {speaker.title && (
                <p className="mb-1.5 text-sm text-white/80">{speaker.title}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative mx-4 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#111] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 text-xl leading-none text-white/50 hover:text-white"
            >
              ×
            </button>
            <div className="mb-5 items-center flex gap-4">
              <div className="relative h-26 w-26 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={selected.image}
                  alt={selected.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl md:text-lg font-black text-white">
                  {selected.name}
                </p>
                {selected.title && (
                  <p className="mt-0.5 text-base md:text-sm text-white/80">
                    {selected.title}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {!selected.activation && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-sm md:text-xs font-semibold ${CATEGORY_STYLES[selected.category].bg} ${CATEGORY_STYLES[selected.category].text}`}
                    >
                      {selected.category}
                    </span>
                  )}
                  {selected.language && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-sm md:text-xs font-semibold text-white">
                      {selected.language}
                    </span>
                  )}
                  {selected.activation && (
                    <>
                      <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-sm md:text-xs font-semibold text-red-400">
                        Activation
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-sm md:text-xs font-semibold ${CATEGORY_STYLES[selected.category].bg} ${CATEGORY_STYLES[selected.category].text}`}
                      >
                        {selected.activation}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {selected.bioZh && (
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setLang("zh")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    lang === "zh"
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  中文
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    lang === "en"
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  EN
                </button>
              </div>
            )}
            <p className="whitespace-pre-line text-base md:text-lg leading-normal md:leading-relaxed text-white/90">
              {lang === "zh" && selected.bioZh ? selected.bioZh : selected.bio}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
