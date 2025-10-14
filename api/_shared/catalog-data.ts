// api/_shared/catalog-data.ts

interface CatImageSeed {
  id: string;
  url: string;
  theme: string;
}

export const MASTER_IMAGE_CATALOG_DATA: Record<string, CatImageSeed[]> = {
  'yes': [
    { id: 'preloaded_yes_1', url: 'https://preview.redd.it/n7dhu9b7th5c1.jpg?auto=webp&s=8a528d1f0fa65f6c19a7cf565f4f5aa503458767', theme: 'Gatos del Sí' },
    { id: 'yes_2', url: 'https://i.pinimg.com/736x/9a/44/68/9a4468f1915dc4a8ba22521cb8733144.jpg', theme: 'Gatos del Sí' },
    { id: 'yes_3', url: 'https://tse4.mm.bing.net/th/id/OIP.Gcm-GAbbn9XGHL1fB_OPwAAAA?cb=12&w=400&h=400&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos del Sí' },
    { id: 'yes_4', url: 'https://i.pinimg.com/736x/69/9a/8c/699a8c548ac0879f91ddb73f5813f13d.jpg', theme: 'Gatos del Sí' },
    { id: 'yes_5', url: 'https://i.pinimg.com/736x/80/ef/f1/80eff16907da7afe0e1d26ab252e2ffc.jpg', theme: 'Gatos del Sí' },
    { id: 'yes_6', url: 'https://tse1.mm.bing.net/th/id/OIP.SSPN2o_dWnsBgZn0xcqmiwHaHY?cb=12&w=720&h=717&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos del Sí' },
    { id: 'yes_7', url: 'https://i.pinimg.com/736x/59/fc/85/59fc853d9b7b066e0ccbac36d955fca3.jpg', theme: 'Gatos del Sí' },
    { id: 'yes_8', url: 'https://www.meme-arsenal.com/memes/3a603dde1c20ae335f363fc0717af0ed.jpg', theme: 'Gatos del Sí' },
    { id: 'yes_9', url: 'https://icdn.planb.mx/uploads/2022/04/FB_IMG_1634755761175-1.jpg?strip=all&lossy=1&w=2560&ssl=1', theme: 'Gatos del Sí' },
    { id: 'yes_10', url: 'https://images7.memedroid.com/images/UPLOADED475/64f8c02457e24.jpeg', theme: 'Gatos del Sí' },
    { id: 'yes_11', url: 'https://i.pinimg.com/originals/8d/c8/3a/8dc83a79c73212a632bbfe89bfb85e09.jpg', theme: 'Gatos del Sí' }
  ],
  'no': [
    { id: 'no_1', url: 'https://rvideos2.memedroid.com/videos/UPLOADED724/6568ce822427f.jpeg', theme: 'Gatos Gruñones' },
    { id: 'no_2', url: 'https://tse2.mm.bing.net/th/id/OIP.5ehzhk4XeCKVVtZgeT8vlQAAAA?cb=12&w=313&h=313&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Gruñones' },
    { id: 'no_3', url: 'https://i.pinimg.com/736x/81/63/78/81637861f1566bb718979b454ce94eed.jpg', theme: 'Gatos Gruñones' },
    { id: 'no_4', url: 'https://ih1.redbubble.net/image.1064884831.2298/raf,360x360,075,t,fafafa:ca443f4786.jpg', theme: 'Gatos Gruñones' },
    { id: 'no_5', url: 'https://tse2.mm.bing.net/th/id/OIP.2g1Dl9udhk3-QnxVNKaNHQHaG6?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Gruñones' },
    { id: 'no_6', url: 'https://i.pinimg.com/originals/3c/48/c3/3c48c3bb6d212fe2b026db8ff224511b.jpg', theme: 'Gatos Gruñones' },
    { id: 'no_7', url: 'https://i.pinimg.com/originals/4a/d0/86/4ad0868981966ec78e1979331cfe5151.jpg', theme: 'Gatos Gruñones' },
    { id: 'no_8', url: 'https://tse2.mm.bing.net/th/id/OIP.Y4WOkK7GRSfdpw5fTq-AsgHaGv?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Gruñones' },
    { id: 'no_9', url: 'https://tse2.mm.bing.net/th/id/OIP.p19ehgcnDuxhQbUkBHpDuAHaHa?cb=12&w=1024&h=1024&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Gruñones' }
  ],
  'happy': [
    { id: 'happy_1', url: 'https://i.pinimg.com/474x/d5/d3/52/d5d352d3fb8376ce5faf812f3103da5e.jpg', theme: 'Gatos Felices' },
    { id: 'happy_2', url: 'https://tse4.mm.bing.net/th/id/OIP.vd5eN6F426x6fHyMedwbDgHaHa?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Felices' },
    { id: 'happy_3', url: 'https://pbs.twimg.com/profile_images/1275189273587789829/3EJKTpUK_400x400.jpg', theme: 'Gatos Felices' },
    { id: 'happy_4', url: 'https://i.pinimg.com/736x/ed/a0/39/eda039d9b92f1b0c842c7657ab55c13c.jpg', theme: 'Gatos Felices' },
    { id: 'happy_5', url: 'https://i.pinimg.com/736x/81/92/24/81922437a07d9625f621e12be0fc2268.jpg', theme: 'Gatos Felices' },
    { id: 'happy_6', url: 'https://i.pinimg.com/236x/a1/c9/41/a1c94163cce9d1a0bab6425a353859e8.jpg', theme: 'Gatos Felices' },
    { id: 'happy_7', url: 'https://pbs.twimg.com/profile_images/1507725609744568322/f8SKk7d5_400x400.jpg', theme: 'Gatos Felices' },
    { id: 'happy_8', url: 'https://i.redd.it/elohtitdb7351.jpg', theme: 'Gatos Felices' },
    { id: 'happy_9', url: 'https://www.meme-arsenal.com/memes/d329f1b2b26a6dd006c03de7d14b5f9a.jpg', theme: 'Gatos Felices' },
    { id: 'happy_10', url: 'https://images-cdn.9gag.com/photo/aEppmmo_700b.jpg', theme: 'Gatos Felices' },
    { id: 'happy_11', url: 'https://tse1.explicit.bing.net/th/id/OIP.OXV5ZDH4DqJI8h5QTCbwLAHaHa?cb=12&w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Felices' }
  ],
  'sad': [
    { id: 'sad_1', url: 'https://limo.ismcdn.jp/mwimgs/e/4/1200w/img_e4885cff7bd9f30838846d303c29a51e32239.jpg', theme: 'Gatos Tristes' },
    { id: 'sad_2', url: 'https://tse1.explicit.bing.net/th/id/OIP.rQrHvGRqQkl_EAqzfi8SpwHaHa?cb=12&w=1080&h=1080&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_3', url: 'https://tse1.explicit.bing.net/th/id/OIP.qFCXas2vl3WdpWw9omjfxAHaHa?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_4', url: 'https://tse1.explicit.bing.net/th/id/OIP.doH2T3nc3aY6PADoDwLBGgHaHO?cb=12&pid=ImgDet&w=206&h=201&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_5', url: 'https://tse1.explicit.bing.net/th/id/OIP.K57wdd2OVcA2oEo8FWbVewHaHY?cb=12&pid=ImgDet&w=206&h=204&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_6', url: 'https://tse1.explicit.bing.net/th/id/OIP.Eo63_NneTYxxYNCWQh0_tgHaHS?cb=12&pid=ImgDet&w=206&h=202&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_7', url: 'https://tse3.mm.bing.net/th/id/OIP.xMGAbLKw7IyMnV4cMUTsbQHaG0?cb=12&pid=ImgDet&w=206&h=190&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_8', url: 'https://tse1.explicit.bing.net/th/id/OIP.QOWeRpGoQYnqqcHGIHKGyQHaGF?cb=12&pid=ImgDet&w=206&h=169&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_9', url: 'https://tse2.mm.bing.net/th/id/OIP.Yjxl0tCbIOYbWmLrz61xPQHaHa?cb=12&pid=ImgDet&w=206&h=206&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_10', url: 'https://tse3.mm.bing.net/th/id/OIP.1yvmJt8PEBmeHHlHzjGA-QHaHa?cb=12&pid=ImgDet&w=206&h=206&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_11', url: 'https://tse2.mm.bing.net/th/id/OIP.I7SroC1Zf2kwrVtlOuQNgQAAAA?cb=12&pid=ImgDet&w=206&h=190&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_12', url: 'https://tse1.explicit.bing.net/th/id/OIP.Sg4M9298TIF1GqRRM3hnwQHaHM?cb=12&pid=ImgDet&w=206&h=199&c=7&o=7&rm=3', theme: 'Gatos Tristes' },
    { id: 'sad_13', url: 'https://i.pinimg.com/originals/85/ce/f0/85cef0dfa3b73f78e69e6a6a04ea3cde.jpg', theme: 'Gatos Tristes' },
    { id: 'sad_14', url: 'https://tse1.explicit.bing.net/th/id/OIP.0ShM9Am2OTYsW9JJ5flFrQAAAA?cb=12&w=440&h=426&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos Tristes' }
  ],
  'help': [
    { id: 'help_1', url: 'https://i.pinimg.com/originals/ea/5f/c9/ea5fc9680cec81756dcd5f12d63dc3f5.jpg', theme: 'Gatos en Apuros' },
    { id: 'help_2', url: 'https://tse2.mm.bing.net/th/id/OIP.48pO9gjlCXklT3ghDVaQMQHaHa?cb=12&w=550&h=550&rs=1&pid=ImgDetMain&o=7&rm=3', theme: 'Gatos en Apuros' },
    { id: 'help_3', url: 'https://media.tenor.com/ldNjzyrqeIMAAAAC/gato-meme.gif', theme: 'Gatos en Apuros' },
    { id: 'help_4', url: 'https://i.pinimg.com/originals/b5/40/ef/b540ef6ffd36e149d3475d9a945d9058.jpg', theme: 'Gatos en Apuros' },
    { id: 'help_5', url: 'https://stickerly.pstatic.net/sticker_pack/M6DUfwweCC1PPhJ9HOcpw/DAS3U4/19/-808047720.png', theme: 'Gatos en Apuros' }
  ]
};
